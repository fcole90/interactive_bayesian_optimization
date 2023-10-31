"""Main application access point"""

import logging
import os

import werkzeug
import werkzeug.exceptions
from flask import Flask, json, render_template, request, send_from_directory

from interactive_bayesian_optimisation import config
from interactive_bayesian_optimisation.libs import io, user_study_gp, utils


def create_app():
    """Application factory function.

    This function generates the app instance of the backend and is useful to  assure that only one instance exists.

    It also retrieves settings from the configuration files to apply them to the application and contains the
    functions related to the different API calls.

    Returns
    -------
    app instance

    """

    # --------------------- #
    # Initial configuration #
    # --------------------- #

    instance_path = config.INSTANCE_PATH

    # Creates the instance path if it doesn't exist
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)

    app = Flask(__name__, instance_path=instance_path)

    # Logging utility setup
    if app.config.get("ENV") == "development" or app.config.get("DEBUG") is True:
        log_level = logging.DEBUG
    else:
        if hasattr(logging, config.DEBUG_LOG_LEVEL):
            log_level = getattr(logging, config.DEBUG_LOG_LEVEL)
        else:
            print(
                "WARNING: log level value from config file is not a valid attribute: {}".format(
                    config.DEBUG_LOG_LEVEL
                )
            )
            print(f"Defaulting to '{logging.WARNING}")
            log_level = logging.WARNING

    logging.basicConfig(
        format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
        level=log_level,
        filename=config.LOG_PATH,
    )

    @app.errorhandler(404)
    def handle_404(e: Exception):  # type: ignore
        print("404", e)
        return json.dumps({"error": str(e)}), 404

    @app.errorhandler(werkzeug.exceptions.HTTPException)
    def handle_errors(e: Exception):  # type: ignore
        """Intercepts generic server errors and logs them."""
        print(e)
        logging.error(str(e))
        return json.dumps({"error": str(e)}), 500

    @app.route("/static/favicon.ico")
    def favicon():  # type: ignore
        """Handles correct favicon."""
        print(app.root_path)
        return send_from_directory(
            os.path.join(app.root_path, "static"),
            "favicon.ico",
            mimetype="image/vnd.microsoft.icon",
        )

    # --------- #
    # Web pages #
    # --------- #

    # Root page
    @app.route("/")
    def index():  # type: ignore
        """Simple root page.

        The "@app.route('/')" decorator assigns this function
        to the '/' address, so that when you visit '/', a
        request is sent to the server, which will call this function.

        Once this function is called it returns an html page
        produced from the 'index.html' file.

        Returns
        -------
            html page
        """
        return render_template("index.html")

    @app.route("/test_drawing")
    def test_drawing_page():  # type: ignore
        return render_template("test_drawing.html")

    @app.route("/log", methods=["GET"])
    def view_log():  # type: ignore
        """Display the log"""
        if request.values.get("clear") == "True":
            with open(config.LOG_PATH, "w") as log_file:
                log_file.write("")
            logging.info("Log file cleared from browser.")
        print(request.values.get("clear"))
        with open(config.LOG_PATH) as log_file:
            log_text = log_file.read()
        return render_template("log.html", log_text=log_text)

    @app.route("/study_legacy")
    def study_legacy():  # type: ignore
        """Renders the study page.

        Returns
        -------
            html page

        """
        return render_template("study-legacy.html")

    @app.route("/study")
    def study():  # type: ignore
        """Renders the study page.

        Returns
        -------
        html page

        """
        return render_template("study.html")

    # --------------------- #
    # API-related functions #
    # --------------------- #

    @app.route("/api_initialise_gp_and_sample", methods=["GET", "POST"])
    def api_initialise_gp_and_sample():  # type: ignore
        """Initialises a GP based on the given parameters.

        The parameters are retrieved from the settings file. After initialising
        the GP it samples a function from it to be the true function. Finally
        it chooses a query point uniformly at random.

        All the data is sent to the frontend as a JSON object to be used by the frontend.

        Returns
        -------
            JSON data

        """

        # Retrieves the data from the request object
        interface_settings = utils.get_response_and_log(request)
        logging.debug("Interface settings: {}".format(str(interface_settings)))

        # Loads the settings file
        settings_file_name = interface_settings["settings_name"]
        settings = io.load_settings(settings_file_name)
        logging.debug("File settings: {}".format(str(settings)))

        # Integrate the settings with those provided by the interface, if any
        for key in interface_settings.keys():
            if key not in settings:
                settings[key] = interface_settings[key]

        # Fail early and provide some error message when crucial data is missing.
        try:
            utils.assert_required_data(settings, ["x_limits", "n_points", "noise"])
        except AssertionError as e:
            logging.error(str(e))
            logging.error("Provided keys: {}".format(settings.keys()))
            return str(e), 400  # BAD_REQUEST

        # Generate user and session IDs if not provided
        user_id: int = (
            settings["user_id"]
            if "user_id" in settings
            else io.get_new_user_id(study_name=settings_file_name)
        )
        settings["user_id"] = str(user_id)

        # Ensure save dir exists
        if not ("save" in settings and settings["save"] == False):
            io.ensure_savedir_exists(
                study_name=settings_file_name, sub_path=str(user_id)
            )

        session_id: int = (
            settings["session_id"]
            if "session_id" in settings
            else io.get_new_session_id(user_id, study_name=settings_file_name)
        )
        settings["user_id"] = str(user_id)
        settings["session_id"] = str(session_id)

        # Call GP data_gp_initialisation function
        (
            x,
            y_true,
            query_index,
            mean_vector,
            confidence_up,
            confidence_down,
        ) = user_study_gp.data_gp_initialisation(
            settings["x_limits"][0],
            settings["x_limits"][1],
            settings["n_points"],
            settings["kernel"],
            settings["kernel_args"],
            settings["noise"],
        )

        # Convert the data to JSON
        data = {
            "settings": settings,
            "iteration": 0,
            "new_point_index": query_index,  # index of new point to be queried
            "new_point_x": x[query_index],  # new point to be queried
            "x_data": [],  # queried data points (initially empty)
            # values given by the user for the queried points (initially empty)
            "y_data": [],
            "y_data_actual": [],  # actual value of f(queried point)
            "x_limits": settings["x_limits"],
            "n_points": settings["n_points"],
            "x": x,  # x points in the interval (linspace)
            "y": y_true,  # f(x) true values in the x points
            "mean": mean_vector,
            "std": confidence_up + confidence_down,  # list concatenation
        }

        # Update session_id to match session, when running a full user study
        if "max_sessions" in settings:
            if (
                "update_session" in interface_settings
                and interface_settings["update_session"] == True
            ):
                data["session"] = interface_settings["session"] + 1
            else:
                data["session"] = 0
            session_id = data["session"]

        if "save" in settings and settings["save"] == False:
            logging.debug('Not saving data because of settings["save"] = False')
        else:
            io.save_data(
                data,
                study_name=settings_file_name,
                user_id=user_id,
                session_id=session_id,
                incremental=settings["save_split"],
            )

        return utils.remove_nan(json.dumps(data))

    @app.route("/api_update_gp", methods=["GET", "POST"])
    def api_update_gp():  # type: ignore
        """Updates a GP based on the given parameters.

        The parameters are retrieved from the request object. It updates the GP with the new points. Finally it chooses
        a new query point.

        All the data is sent to the frontend as a JSON object.

        Returns
        -------
            JSON data

        """
        logging.info("Called: api_update_gp")
        data = utils.get_response_and_log(request)
        try:
            utils.assert_required_data(
                data,
                [
                    "settings",  # settings of the user study
                    "x_data",  # queried data points
                    "y_data",  # values by the user for the queried points
                    "x_limits",  # beginning and end of the interval
                    "x",  # x points
                    "iteration",  # current iteration
                ],
            )
        except AssertionError as e:
            logging.error(str(e))
            logging.error("Provided keys: {}".format(data.keys()))
            return str(e), 400  # BAD_REQUEST

        if ("x_data" in data and "y_data" in data) and (
            len(data["x_data"]) >= 1 and len(data["y_data"]) >= 1
        ):
            logging.info(
                "Received new data point: ({}, {}), updating..".format(
                    data["x_data"][-1], data["y_data"][-1]
                )
            )

        settings = data["settings"]

        # Update vanilla GP
        (
            query_index,
            mean_vector,
            upper_confidence,
            lower_confidence,
        ) = user_study_gp.update(
            data["x"],
            settings["kernel"],
            settings["kernel_args"],
            data["x_data"],
            data["y_data"],
            settings["noise"],
        )

        # Update data
        data["new_point_index"] = query_index
        data["new_point_x"] = data["x"][query_index]
        data["mean"] = mean_vector
        data["std"] = upper_confidence + lower_confidence
        data["iteration"] += 1

        data_json = utils.remove_nan(json.dumps(data))
        if "save" in settings and settings["save"] == False:
            logging.debug('Not saving data because of settings["save"] = False')
        else:
            logging.debug(f'Study name: {settings["settings_name"]}')
            io.save_data(
                data,
                study_name=settings["settings_name"],
                user_id=settings["user_id"],
                session_id=settings["session_id"],
                incremental=settings["save_split"],
            )
        return data_json

    return app

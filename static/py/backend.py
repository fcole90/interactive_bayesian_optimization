from js import request

def remove_nan(json_string):
    return json_string.replace('NaN', 'null')

def api_initialise_gp_and_sample():
    # Retrieves the data from the request object
    interface_settings = request["data"]

    # Loads the settings file
    settings_file_name = interface_settings['settings_name']
    settings = io.load_settings(settings_file_name)

    # Integrate the settings with those provided by the interface, if any
    for key in interface_settings.keys():
        if key not in settings:
            settings[key] = interface_settings[key]

    # Fail early and provide some error message when crucial data is missing.
    try:
        utils.assert_required_data(settings, ['x_limits', 'n_points', 'noise'])
    except AssertionError as e:
        logging.error(str(e))
        logging.error("Provided keys: {}".format(settings.keys()))
        return str(e), 400  # BAD_REQUEST

    # Generate user and session IDs if not provided
    user_id: int = settings['user_id'] if 'user_id' in settings else io.get_new_user_id(
        study_name=settings_file_name)
    settings['user_id'] = str(user_id)

    # Ensure save dir exists
    if not ("save" in settings and settings["save"] == False):
        io.ensure_savedir_exists(study_name=settings_file_name, sub_path=str(user_id))

    session_id: int = settings['session_id'] if 'session_id' in settings else io.get_new_session_id(user_id,
                                                                                                    study_name=settings_file_name)
    settings['user_id'] = str(user_id)
    settings['session_id'] = str(session_id)

    # Call GP data_gp_initialisation function
    x, y_true, query_index, mean_vector, confidence_up, confidence_down = user_study_gp.data_gp_initialisation(
        settings['x_limits'][0],
        settings['x_limits'][1],
        settings['n_points'],
        settings['kernel'],
        settings['kernel_args'],
        settings['noise']
    )

    # Convert the data to JSON
    data = {
        "settings": settings,
        "iteration": 0,
        "new_point_index": query_index,  # index of new point to be queried
        "new_point_x": x[query_index],  # new point to be queried
        'x_data': [],  # queried data points (initially empty)
        'y_data': [],  # values given by the user for the queried points (initially empty)
        'y_data_actual': [],  # actual value of f(queried point)
        'x_limits': settings['x_limits'],
        'n_points': settings['n_points'],
        "x": x,  # x points in the interval (linspace)
        "y": y_true,  # f(x) true values in the x points
        "mean": mean_vector,
        "std": confidence_up + confidence_down,  # list concatenation
    }

    # Update session_id to match session, when running a full user study
    if "max_sessions" in settings:
        if "update_session" in interface_settings and interface_settings["update_session"] == True:
            data["session"] = interface_settings["session"] + 1
        else:
            data["session"] = 0
        session_id = data["session"]

    #     if "save" in settings and settings["save"] == False:
    #         logging.debug("Not saving data because of settings[\"save\"] = False")
    #     else:
    #         io.save_data(data,
    #                      study_name=settings_file_name,
    #                      user_id=user_id,
    #                      session_id=session_id,
    #                      incremental=settings['save_split'])

    return utils.remove_nan(json.dumps(data))
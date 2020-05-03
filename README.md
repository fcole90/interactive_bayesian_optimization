# Interactive Bayesian Optimization
This repository contains the code employed for the experiments and the analysis of *Human Strategic Steering Improves Performance of Interactive Optimization*

## Human Strategic Steering Improves Performance of Interactive Optimization
Fabio Colella*, Pedram Daee*, Jussi Jokinen, Antti Oulasvirta, Samuel Kaski
<sup>*Both authors contributed equally to this research.</sup>

User study for ATOM project.

## Backend

The main file of the project, server side, is `app.py`, located under `ai_tom/app.py`. This contains some
API functions which are called from the browser client in order to retrieve the required data (e.g. GP,
function sample, new query points, etc).

The backend uses some settings files in the YAML format, that describe different options both for
the backend and the frontend. These are loacated under `settings/`.

Libraries for the python backend are under `ai_tom/libs/`.

The evaluation function is `ai_tom/evaluation.py` and needs a folder of user studies to be specified 
the end of the script. It will produce plots under `instance/plots/`. 


## Frontend

The main file for the UI is `ui.js`, located under `ai_tom/static/libs/ui.js`.

Libraries for the UI and other JS stuff is located under `ai_tom/static/libs/`.



### JSON keywords
This app uses a backend - frontend communication using JSON files. 
Following you can find a list of all the keywords employed.

#### Keywords related to function values
- `"x"`: list of sampled points for plotting the true function.
- `"y"`: list of f(x) for each sampled point of the true function.
- `"mean"`: list of means for the AI belief for each sampled point.
- `"std"`: **WARNING:** list of (std + mean) for the AI belief for each sampled point,
followed by a list of (std - mean) for the AI belief for each sampled point. 
The list is hence long twice the number of sampled points.
- `"new_point_index"`: index of the `x`-list for the new queried point. 
- `"new_point_x"`: new queried point.
- `"x_limits"`: *See the same on [Keywords for the settings dictionary](#keywords-for-the-settings-dictionary)*.
- `"n_points"`: *See the same on [Keywords for the settings dictionary](#keywords-for-the-settings-dictionary)*.
- `"x_data"`: list of queried points. **WARNING:** Not the indices of the points, but the actual points.
- `"y_data"`: list of user feedback values, one for each query point.
- `"y_data_actual"`: list of true function values,f(x), for each each query point.

#### Keywords related to the user study interface
- `"iteration"`: iteration number, 1-based.
- `"session"`: session number, 1-based.
- `"settings"`: settings dictionary.

#### Keywords for the settings dictionary
- `"settings_name"`: string, name of the settings file. If must not contain spaces.
- `"display_uncertainty"`: (Optional) boolean to display or not the uncertainty. Defaults to true.
- `"exploration_sessions"`: (Optional) integer value to set that the first *n* sessions are for practice. Defaults to 0.
- `"max_iterations"`: integer, the amount of iterations to run in each session.
- `"max_sessions"`: integer, the amount of sessions to run in the study.
- `"n_points"`: integer, number of points in the sample space. You can use it like `np.linspace(start=x_limits[0], stop=x_limits[1], num=n_points)`.
- `"x_limits"`: list of two elements (integers) containing the first and last point of the `x`-list.
You can use it like `np.linspace(start=x_limits[0], stop=x_limits[1], num=n_points)`.
- `"kernel"`: string for the name of the kernel. Available options:
    `"rbf_kernel"`.
- `"kernel_args"`: dictionary of kernel arguments. E.g. if you are using `"rbf_kernel"`
 you can set it to `{"sigma": 0.5, "theta": 500}`.
- `"noise"`: float, gaussian noise over the feedback values.
- `"save_split"`: (Optional) boolean to split the save files between iterations or not. Defaults to false.
When disabled it creates a single save file containing a list of data dictionaries, one for each iteration.
- `"scaling value"`: float retrieved from the UI which represents the visual scaling of the function with respect to
the original.
- `"session"`: session number 0-based
- `"session_id"`: (Optional) session number 1-based. If not set a new one is created automatically.
- `"user_id"` (Optional) user number 1-based. If not set a new one is created automatically.
- `"update_session"`: (Optional) boolean to determine if at the end of the session a new session should be generated.
If defaults to false. If running a user study, it's updated automatically to match the session and iteration 
requirements.

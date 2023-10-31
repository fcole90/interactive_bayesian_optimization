# Interactive Bayesian Optimization

This repository contains the code employed for the experiments and the analysis of *Human Strategic Steering Improves Performance of Interactive Optimization*. [Presentation Website](https://fcole90.github.io/interactive_bayesian_optimization/) | [Try Online Demo](https://fcole90.github.io/interactive_bayesian_optimization/demo.html) | [Video Presentation](https://youtu.be/4noJRNVK9Ro)

### Human Strategic Steering Improves Performance of Interactive Optimization

Fabio Colella, Pedram Daee, Jussi Jokinen, Antti Oulasvirta, Samuel Kaski
<br>**UMAP 2020** <https://dl.acm.org/doi/10.1145/3340631.3394883>, also on arXiv <https://arxiv.org/abs/2005.01291>

#### Abstract

A central concern in an interactive intelligent system is optimization of its actions, to be maximally helpful to its human user. In recommender systems for instance, the action is to choose what to recommend, and the optimization task is to recommend items the user prefers. The optimization is done based on earlier user's feedback (e.g. "likes" and "dislikes"), and the algorithms assume the feedback to be faithful. That is, when the user clicks “like,” they actually prefer the item. We argue that this fundamental assumption can be extensively violated by human users, who are not passive feedback sources. Instead, they are in control, actively steering the system towards their goal. To verify this hypothesis, that humans steer and are able to improve performance by steering, we designed a function optimization task where a human and an optimization algorithm collaborate to find the maximum of a 1-dimensional function. At each iteration, the optimization algorithm queries the user for the value of a hidden function *f* at a point *x*, and the user, who sees the hidden function, provides an answer about *f*(*x*). Our study on 21 participants shows that users who understand how the optimization works, strategically provide biased answers (answers not equal to *f*(*x*)), which results in the algorithm finding the optimum significantly faster. Our work highlights that next-generation intelligent systems will need user models capable of helping users who steer systems to pursue their goals.

![final_UI_interface](https://user-images.githubusercontent.com/1292230/80922451-e0ce3a80-8d85-11ea-9b7b-f0c4bc428008.png)
<figcaption><sup>Figure: User Interface of the application</sup></figcaption>

### Libraries derived from this project

- [pyutils.js](https://github.com/fcole90/pyutils)
- [canvasplotlib.js](https://github.com/fcole90/canvasplotlib)
- [simple_numeric.js](https://github.com/fcole90/interactive_bayesian_optimization/blob/master/interactive_bayesian_optimisation/static/libs/simple_numeric.js)

### How to use

You can try the application online at <https://fcole90.github.io/interactive_bayesian_optimization/>.

##### Requirements

**Python libraries**

- `flask`
- `numpy`
- `scipy`

You should also have a modern browser (e.g. Google Chrome 81).

##### Running the application

From terminal, you can run the app with `./start-app.py`. It will show you an URL where the app is running, like for example <http://127.0.0.1:5000/>

If you open it, you can select (type) one of the following configurations:

- `default`
- `study_10`
- `study_5`
- `study_training`

### Implementation details

#### Backend

The main file of the project, server side, is `app.py`, located under `ai_tom/app.py`. This contains some
API functions which are called from the browser client in order to retrieve the required data (e.g. GP,
function sample, new query points, etc).

The backend uses some settings files in the YAML format, that describe different options both for
the backend and the frontend. These are loacated under `settings/`.

Libraries for the python backend are under `ai_tom/libs/`.

The evaluation function is `ai_tom/evaluation.py` and needs a folder of user studies to be specified
the end of the script. It will produce plots under `instance/plots/`.

In the online demo the backend is run in a webworker which invokes a wasm python interpreter using [Pyodide](https://pyodide.readthedocs.io/en/latest/index.html).

## Development setup

### Frontend

```sh
make build-fe
make dev-fe
```

Leave it run in a terminal.

### Backend

Prepare your local environment:
You need Python 3.10 minimum. If you don't have it, you can install it using [pyenv](https://github.com/pyenv/pyenv#how-it-works).

Then `pyenv install 3.10 && pyenv local 3.10`.

Create a virtual env:

```sh
make .venv
```

and activate it according to your platform.

Then, with the environment active, install its dependencies:

```sh
make install
make install-dev
```

Then you can start the server:

```sh
make start
```

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

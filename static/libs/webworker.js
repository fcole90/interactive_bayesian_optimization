self.languagePluginUrl = 'https://pyodide-cdn2.iodide.io/v0.15.0/full/';
importScripts('https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js');
importScripts('../py/backend.js');

function get_config(file_name="default") {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("Fetching json config..");
      fetch(`../../configurations/${file_name}.json`)
        .then(response => response.text())
        .then(json => {
          resolve(json);
        })
        .catch((err) => { console.error(err) });
    }, 2000);
  });
}

var onmessage = async function (e) {
  const some_code = `
  from js import request
  import json
  
  def main():
    print("url:", request["url"])
    print("config:", json.loads(request["config"]).keys())
    print("ajax_data:", request["ajax_data"])
    print("__name__:", __name__)
    return "OK PYTHON"

  def js_main():
      print(request)
  
  
  if __name__ == "builtins":
      js_main()

  main()
  `

  // Obtain the js parameters to run the code
  let data = e.data;
  if (data.url === "api_initialise_gp_and_sample") {
    if (data.config === null) {
      let settings_name = JSON.parse(data.ajax_data).settings_name;
      console.log(data.ajax_data);
      switch (settings_name) {
        case "study_5":
        case "study_10":
        case "study_training":
          console.log("Loading from:", settings_name)
          data.config = await get_config(settings_name);
          break;
        default:
          console.log("Loading from default, requested:", settings_name);
          data.config = await get_config();
      }
    } else {
      console.log("Config required but available.")
    }
  }

  languagePluginLoader.then(() => {
      // Create a python package named request
      self["request"] = data;
      // Start the chain of promises
      // self.pyodide.runPythonAsync(some_code, () => {})
      self.pyodide.runPythonAsync(python_script, () => {})
        .then((results) => {
          console.log("Should post a message..");
          self.postMessage({
            success: {
              results: results,
              url: data.url
            }
          });
        })
        .catch((err) => {
          // if you prefer messages with the error
          // console.log("Something went wrong...");
          // self.postMessage({error: err.message});
          // if you prefer onerror events
          setTimeout(() => { throw err; });
        });
    });
  // });
};


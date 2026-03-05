importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js');
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

async function initPyodide() {
    console.log("Initializing Pyodide...");
    let pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
    });
    
    console.log("Loading math packages...");
    // Explicitly load the packages your backend likely needs
    await pyodide.loadPackage(['numpy', 'scipy']); 
    
    console.log("Pyodide is ready.");
    return pyodide;
}

// Setup a global variable to hold the initialized pyodide instance
const pyodideReadyPromise = initPyodide();

var onmessage = async function (e) {
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

  // Wait for the Pyodide instance to be ready
  let pyodide = await pyodideReadyPromise;

  try {
      // Create a python package named request
      self["request"] = data;
      
      // Run the script
      let results = await pyodide.runPythonAsync(python_script);
      
      console.log("Should post a message..");
      self.postMessage({
        success: {
          results: results,
          url: data.url
        }
      });
  } catch (err) {
      setTimeout(() => { throw err; });
  }
};

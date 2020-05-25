self.languagePluginUrl = 'https://pyodide-cdn2.iodide.io/v0.15.0/full/';
importScripts('https://pyodide-cdn2.iodide.io/v0.15.0/full/pyodide.js');

var onmessage = function (e) {
  // eslint-disable-line no-unused-vars
  const some_code__ = `
  from js import request
    
  DIST_URL = 'public/interactive_bayesian_optimisation-1.2.1-py3-none-any.whl'
  
  def main():
    print("Installed!")
    import interactive_bayesian_optimisation
    print(dir(interactive_bayesian_optimisation))
    print("A print from python")
    print(dir(request))
    print(request["success"])
    print(request["url"])
    return "bob"
  
  import micropip
  micropip.install(numpy).then(main)
  `

  const some_code = `
  def do_work(*args):
      print("Installed!")
      import interactive_bayesian_optimisation
      print(dir(interactive_bayesian_optimisation))
  
  import micropip
  micropip.install('https://fcole90.github.io/interactive_bayesian_optimization/public/interactive_bayesian_optimisation-1.2.1-py3-none-any.whl').then(do_work)
  `


  languagePluginLoader.then(() => {
    self.pyodide.loadPackage(['numpy', 'micropip']).then(() => {

      // Obtain the js parameters to run the code
      const data = e.data;

      // Create a python package named request
      self["request"] = data;

      // Start the chain of promises
      self.pyodide.runPythonAsync(some_code, () => {})
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
          console.log("Something went wrong...");
          self.postMessage({error: err.message});
          // if you prefer onerror events
          // setTimeout(() => { throw err; });
        });
    });
  });
};
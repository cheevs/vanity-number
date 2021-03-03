import React from "react";
import VanityNumber from "./VanityNumber";

function App(props) {

  const [data, setData] = React.useState(null);
  React.useEffect(() => {
      fetch(`/v1/vanityNumbers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      }).then((result) => {
        console.log(result);
        return result.json();
      }).then((body) => {
        console.log("data: ", body);
        setData(body);
      });
  });

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark">
        <div className="row">
          <a className="navbar-brand" href="#">
            <div className="row">
              <div className="col">
                <h1 className="h1-nav mt-2">Vanity Number Generator Web App</h1>
              </div>
            </div>
          </a>
        </div>
      </nav>
      <div>
        { data ? data.map((vanityNumbers) => {
          console.log(vanityNumbers);
          return <VanityNumber vanityNumbers={vanityNumbers.vanityNumbers}/>
        }) :  "No Results"}
      </div>
    </div>
  );
}

export default App;

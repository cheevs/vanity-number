import React from "react";

function App(props) {
  const search = new URLSearchParams(window.location.search);
  const id = search.get("id");
  console.log("retrieved id from  url", id);

  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    if (!data && id) {
      fetch(`/v1/alerts/${id}`, {
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
    }
  });

  return (
    <div className="row">
      HI
    </div>
  );
}

export default App;

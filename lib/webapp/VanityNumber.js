import React from "react";

function VanityNumber(props) {
  return (
    <div>
      <table className="table">
        <thead>
        <tr>
          <th scope="col">Caller Phone Number</th>
          <th scope="col">Vanity Word</th>
          <th scope="col">Vanity Number</th>
        </tr>
        </thead>
        <tbody>
        {
          props.vanityNumbers.map((vanityNumber) => {
            return <tr>
              <td>{vanityNumber.callerNumber}</td>
              <td>{vanityNumber.vanityMatch}</td>
              <td>{vanityNumber.vanityNumber}</td>
            </tr>
          })
        }
        </tbody>
      </table>
    </div>
  );
}

export default VanityNumber;
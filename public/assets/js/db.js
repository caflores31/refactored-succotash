const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

  //create new db for budget database
let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = (event) => {
  event.target.result.createObjectStore("pending", {
    keyPath: "id",
    autoIncrement: true
  });
};

request.onerror = (err) => {
  console.log(err.message);
};

request.onsuccess = (event) => {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

function saveRecord(record) {
    //create transactionon the pending db with readwrite access
  const transaction = db.transaction("pending", "readwrite");
  const store = transaction.objectStore("pending");
  // add record to store with add method
  store.add(record);
}


function checkDatabase() {
    // open a transaction for pending db
  const transaction = db.transaction("pending", "readonly");
  // access pending object store
  const store = transaction.objectStore("pending");
  // get All records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then((response) => response.json())
        .then(() => {
            // if succesful, open a transaction for pending db
          const transaction = db.transaction("pending", "readwrite");

          //access pending object store
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
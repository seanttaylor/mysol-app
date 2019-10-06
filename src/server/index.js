function HTTPServer(bottle) {
  /* Use of ES5 functions required with service declarations.
     * See https://github.com/young-steveo/bottlejs/issues/103
     */

  bottle.service('HTTPServer', function(status)  {
    const http = require('http');
    const express = require('express');
    const app = express();
    const bodyParser = require('body-parser');
    const morgan = require('morgan');
    const cors = require('cors');
    const serverPort = 8080;

    app.use(cors());
    app.use(morgan('combined'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static('www'));
    app.use(express.static('dist'));


    http.createServer(app).listen(serverPort, () => {
      console.log('mySōl app is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    });
  });
}

module.exports = HTTPServer;

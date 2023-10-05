const express = require('express');
const bodyParser = require('body-parser');
const verifikasi = require('./middleware/verifikasi');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const apiDocumentation = require('./apidocs.json');

const app = express();

process.env.TZ = "Asia/Jakarta";
console.log(new Date().toString());

//parse application/json
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(morgan('dev'));

// Set up swagger UI options
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true
  }
};

// Serve API documentation using swagger-ui-express
app.use('/docs', swaggerUi.serve, swaggerUi.setup(apiDocumentation, swaggerUiOptions));

//panggil routes
var routes = require('./routes');
routes(app);

//daftarkan menu routes dari index
app.use('/', require('./middleware'));

app.listen(3000, () => {
    console.log('Server started on port');
});

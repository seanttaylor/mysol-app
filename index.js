const Bottle = require("bottlejs");
const myBottle = new Bottle();
const services = require("./src/index.js");

(function bootstrap(instance, services) {
    //Instantiate all services with an instance of Bottle.
    Object.values(services).map((service) => service(instance));
        
    //Launch the http server.
    instance.container.HTTPServer;
    
}(myBottle, services));

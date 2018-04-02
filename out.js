const figlet = require('figlet');
const chalk = require('chalk');
//const readline = require('readline');

 //dar color
const colorize = (msq, color)=> {
	if (typeof color !== "undefined"){
		msq = chalk[color].bold(msq);
	}
	return msq;
};

// escribe el mensaje de log
const log = (socket, msq, color) => {
    socket.write(colorize(msq, color) + "\n");
};

//escribe un mensaje de log en grande
const biglog=(socket, msq, color) => {
	log(socket, figlet.textSync(msq, {horizontalLayout: 'full'}), color);
};

//escribe el mensaje de error emsg
const errorlog = (socket, emsq)  => {
	 socket.write(`${colorize("Error", "red")}:${colorize(colorize(emsq, "red"), "bgYellowBright")}  + "\n"`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};


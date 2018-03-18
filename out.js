const figlet = require('figlet');
const chalk = require('chalk');
const readline = require('readline');

 //dar color
const colorize = (msq, color)=> {
	if (typeof color !== "undefined"){
		msq = chalk[color].bold(msq);
	}
	return msq;
};

// escribe el mensaje de log
const log = (msq, color) => {
    console.log(colorize(msq, color));
};

//escribe un mensaje de log en grande
const biglog=(msq, color) => {
	log(figlet.textSync(msq, {horizontalLayout: 'full'}), color);
};

//escribe el mensaje de error emsg
const errorlog = (emsq)  => {
	console.log (`${colorize("Error", "red")}:${colorize(colorize(emsq, "red"), "bgYellowBright")}`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog
};


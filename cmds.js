const model = require("./model");
const {log, biglog, errorlog, colorize} = require("./out");

//funcion de ayuda que muestra los distintos comandos
exports.helpCmd = rl => {
	console.log('comandos');
       console.log('h|help - Muestra esta ayuda.');
       console.log('list - Listar los quizzes existentes.');
       console.log('show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
       console.log('add - Añadir un nuevo quiz interactivamente.');
       console.log('delete <id> - Borrar el quiz indicado.');
       console.log('edit <id> - Editar el quiz indicado.');
       console.log('test <id> - Probar el quiz indicado.');
       console.log('p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
       console.log('credits - Créditos.');
       console.log('q|quit - Salir del programa.');
    rl.prompt();
};



//muestra una lista de las preguntas que existen
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	});

    rl.prompt();
};

//añade una pregunta a la lista
exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize(' Introduzca una respuesta ', 'red'), answer => {
			model.add(question, answer);
			log(` ${colorize('se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta' )} ${answer}`);
	        rl.prompt();
	    });
	});
};

//muestra el quiz indicado en el parametro: pregunta y respuesta
//@param id clave del quiz a mostrar
exports.showCmd = (rl, id) => {

	if (typeof id === "undefined") {
		errorlog (`Falta el parametro id`);
	}else{
		try {
			const quiz = model.getByIndex(id);
			log(` [${ colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
		}catch (error){
			errorlog(error.message);
		}
	}

    rl.prompt();
};

//borra un quiz de la lista
//@param id clave del quiz show 55a eleminar del modelo
exports.deleteCmd = (rl, id) => {
	if (typeof id === "undefined") {
		errorlog (`Falta el parametro id`);
		//rl.prompt();
	}else{
		try {
			model.deleteByIndex(id);
		}catch (error){
			errorlog(error.message);
			//rl.prompt();
		}
	}rl.prompt();
};

//edito un quiz del modelo
//@param id clave del quiz a editar del modelo
exports.editCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog(`Falta el parametro id. `);
		rl.prompt();
	}else{
		try{
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
			rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
		        process.stdout.isTTY && setTimeout (() => {rl.write(quiz.answer)},0);
		        rl.question(colorize(' Introduzca una respuesta ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')}: por: ${question} ${colorize('=>', 'magenta' )} ${answer}`);
			        rl.prompt();
			    });
			});
		}catch(error)  {
            errorlog(error.message);
			rl.prompt();
		}
	}
};

//prueba un quiz
//@param id clave del quiz a probar
exports.testCmd = (rl, id) => {
     if (typeof id === "undefined"){
		errorlog(`Falta el parametro id. `);
		rl.prompt();
	}else{
		try{
			const quiz = model.getByIndex(id);
			//imprimo la pregunta en azul
			console.log(colorize(`${quiz.question}`,'red'));
			rl.question ('Respuesta: ', answer =>{
				//quitamos simbolos, espacios y mayusc
			 var resp1= answer.replace(/[^a-zA-Z 0-9.]+/g, '');
			 var resp2= resp1.trim();
			 //var resp2= resp1.replace(/\s+/g, '');
			 var resp= resp2.toLowerCase();
                //comprobamos si la respuesta es correcta
            	if( resp === quiz.answer.toLowerCase()) {
            		log ('Su respuesta es correcta. ');
					biglog ('Correcta', 'green');
				} else {
					log ('Su respuesta es incorrecta. ');
					biglog ('Incorrecta', 'red');
				}
				rl.prompt();

			});
			
        }catch (error)  {
            errorlog(error.message);
			rl.prompt();
		}
	}	
	
};

//va sacando preguntas en orden aleatorio. Se acaba si contestas a todo correctamente
exports.playCmd = rl => {
    let score = 0;
	let porResponder = [];
	let totalPreguntas = model.getAll();

	//enumeramos las que quedan por responder. Metemos los id existentes
	for( let i = 0; i < model.count(); i++){
		porResponder [i]=i;
	}

    
    const playOne = () => {
	if (porResponder===0) {
		log('No hay que preguntar','black');
		log('Fin del juego. Aciertos:', score);
		biglog (score, 'magenta');
		rl.prompt();
	}else{
		//let id = pregunta al azar de por responder (num aleatorio: math.random()*porResponder)
		let id = Math.floor(Math.random()*porResponder.length);
        //sacar  la pregunta asociada a ese id;
        //let quiz = model.getByIndex(id);
        let quiz = porResponder [id];

		//console.log(colorize(`${quiz.question}`,'red'));
		rl.question (console.log(colorize(`${quiz.question}`,'red')), answer =>{
             //quitamos simbolos, espacios y mayusc
			 var resp1= answer.replace(/[^a-zA-Z 0-9.]+/g, '');
			 var resp2= resp1.trim();
			 var resp= resp2.toLowerCase();
			 var oficial1 = quiz.answer;
			 var oficial =oficial1.toLowerCase();
                //comprobamos si la respuesta es correcta
            	if( resp === oficial) {
            		log ('CORRECTO - Lleva', score, 'aciertos.');
					score= core + 1;
				} else {
					log ('INCORRECTO - Ha conseguido ', score, 'aciertos');
					biglog ('Incorrecta', 'red');
					log ('fin del juego');
				}
				rl.prompt();

			});	
		//quitarla del array
		porResponder.splice(id,1);
 	    }
 	}
 		
 	playOne();	
};



//nombre del autor de la practica
exports.creditsCmd = rl => {
        console.log('Autor de la práctica');
        console.log('Rocio Hernandez Lara');
        rl.prompt();
};

//termina el programa
exports.quitCmd = rl => {
    rl.close();
};

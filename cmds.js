//video min 25:19

const {models} = require("./model");
const {log, biglog, errorlog, colorize} = require("./out");
const readline = require('readline');
const Sequelize = require ('sequelize');

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
    //antiguo
	//model.getAll().forEach((quiz, id) => {
	//	log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	//});

    //rl.prompt();

    //nuevo
    models.quiz.findAll()  //cuando se cumpla la primesa devuelve todos los quizzes
    .each(quiz => {
     	   //imprimo el identificador, campo question
     		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
     	})

    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};

const makeQuestion = (rl, text) => {
	return new Sequelize.Promise ((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

//añade una pregunta a la lista
exports.addCmd = rl => {
	makeQuestion (rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca una respuesta')
		.then( a =>{
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
	
		log(` ${colorize('Se han añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
Funcion auxiliar que devuelve una promesa que
-valida que se ha introducido un calor para el parametro
-convierte el parametro en un numero entero
si todo va bien, la promesa se satisface y devuelove el valor de id a usar
@param id Parametro com el indice a validar
*/
const validateId = id => {
	return new Sequelize.Promise ((resolve, reject) => {
		if (typeof id === "undefined") { //hay valor?
			reject(new Error (`Falta el parametro <id>.`));
		} else { //ese valor es un numero?
			id = parseInt(id); //coge la parte entera
			if (Number.isNaN(id)) {
				reject (new Error ( `El valor del parametro <id> no es un numero`));
			} else { //es correcto
				resolve (id);
			}
		}
	});
};

//muestra el quiz indicado en el parametro: pregunta y respuesta
//@param id clave del quiz a mostrar
exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

//borra un quiz de la lista
//@param id clave del quiz show 55a eleminar del modelo
exports.deleteCmd = (rl, id) => {
	validateId(id) //primero promesa de validar id
	.then(id => models.quiz.destroy({where: {id}})) //desdemodels(la base de datos) hago un destroy del correspondiente al id
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//edito un quiz del modelo
//@param id clave del quiz a editar del modelo
exports.editCmd = (rl, id) => {
	validateId(id) // promesa para validar id
	.then(id => models.quiz.findById(id)) //promesa que busca la pregunta a editar por su id
	.then(quiz => {//pasa como parrametro el quiz que ha encontrado
		if (!quiz) { // si no ha encontrado el quiz, id que no existe
			throw new Error (`No existe un quiz asociado al id=${id}.`);
		}

		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta:') //edita texto de la pregunta
		.then (q => {
			process.stdout.isTTY && setTimeout (() => {rl.write(quiz.answer)}, 0);
			return makeQuestion(rl, ' Introduzca la respuesta ') //edita el texto de la respuesta
			.then (a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz; //devuelvo el quiz actualizado
			});
		});
	})
	.then(quiz => { //recibo el quiz cambiado y lo guardo en la base de datos
		return quiz.save ();
	})
	.then (quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')}: por: ${quiz.question} ${colorize('=>', 'magenta' )} ${quiz.answer}`);	       
	})
	.catch(Sequelize.ValidationError, error =>{ //error de validacion
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//prueba un quiz
//@param id clave del quiz a probar
//nuevo: validar id, acceder a la base de datos como en edit, y preguntar por la preg asociada al quiz y comprobar que este bien
exports.testCmd = (rl, id) => {

validateId(id) // promesa para validar id
	.then(id => models.quiz.findById(id)) //promesa que busca la pregunta a editar por su id

	.then(quiz => {//pasa como parametro el quiz que ha encontrado
		if (!quiz) { // si no ha encontrado el quiz, id que no existe
			throw new Error (`No existe un quiz asociado al id=${id}.`);
		}

		//process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
		log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`); //imprime la pregunta
			return makeQuestion(rl, ' Introduzca la respuesta ') //edita el texto de la respuesta
			.then (a => {
				if (quiz.answer === a){
					log ('Su respuesta es correcta. ');
					biglog ('Correcta', 'green');
				} else {
					log ('Su respuesta es incorrecta. ');
					biglog ('Incorrecta', 'red');
				}
			});
	})
	.catch(Sequelize.ValidationError, error =>{ //error de validacion
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});

    /* if (typeof id === "undefined"){
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
	}	*/
	
};

//va sacando preguntas en orden aleatorio. Se acaba si contestas a todo correctamente
//se pueden guardar en un array las preguntas de forma aleatoria, usar promesas
exports.playCmd = rl => {
    let score = 0;
	let porResponder = [];
	let totalPreguntas = model.getAll();
	porResponder.length = model.count();
	let restantes = porResponder.length;

	//enumeramos las que quedan por responder. Metemos los id existentes
	for( let i = 0; i < model.count(); i++){
		porResponder [i]=i;
        //porResponder[i] = model.getByIndex(i);
	}

    
    const playOne = () => {
	if (porResponder===0) {
		log('No hay mas que preguntar');
		log('Fin del juego. Aciertos:', score);
		biglog (score, 'magenta');
		rl.prompt();
	}else{
		//let id = pregunta al azar de por responder (num aleatorio: math.random()*porResponder)
            //var preguntas = model.count;
           // let aleatorio= Math.random()*preguntas;
            let id = Math.floor(Math.random()*restantes);
            //sacar  la pregunta asociada a ese id;
           // var actual = porResponder[id];
            //const quiz = porResponder[id];
             const quiz = model.getByIndex(id);
			log(` [${ colorize(id, 'magenta')}]: ${quiz.question}`);
            //log (`${quiz.question}`);
            rl.question(colorize(' Su respuesta ', 'red'), answer => {
            //rl.question (log(colorize(`${quiz.question}:  `,'red')), answer => {
                 //quitamos simbolos, espacios y mayusc
                 var oficial= quiz.answer.toLowerCase().trim();
                 var resp = answer.toLowerCase().trim();
                    //comprobamos si la respuesta es correcta
                    if( resp === oficial) {
                        model.deleteByIndex(id);
                        score ++;
                        totalPreguntas --;
                        log (`CORRECTO - Lleva ${score} aciertos.`);
                        biglog ('correcta', 'green');
                        playOne();
				    } else {
				    	 log (`INCORRECTO - HA CONSEGUIDO ${score} aciertos.`);
                         biglog ('correcta', 'green');
                         log (`FIN`);
				   
				    rl.prompt();
				}

			});
 	    }
 	}
 		
 	playOne();	
};



//nombre del autor de la practica
exports.creditsCmd = rl => {
        log('Autor de la práctica');
        log('ROCIO');
        rl.prompt();
};

//termina el programa
exports.quitCmd = rl => {
    rl.close();
};

//video min 25:19

const {models} = require("./model");
const {log, biglog, errorlog, colorize} = require("./out");
const readline = require('readline');
const Sequelize = require ('sequelize');

//funcion de ayuda que muestra los distintos comandos
exports.helpCmd = (socket, rl) => {
	   console.log(socket, 'comandos');
       console.log(socket, 'h|help - Muestra esta ayuda.');
       console.log(socket, 'list - Listar los quizzes existentes.');
       console.log(socket, 'show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
       console.log(socket, 'add - Añadir un nuevo quiz interactivamente.');
       console.log(socket, 'delete <id> - Borrar el quiz indicado.');
       console.log(socket, 'edit <id> - Editar el quiz indicado.');
       console.log(socket, 'test <id> - Probar el quiz indicado.');
       console.log(socket, 'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
       console.log(socket, 'credits - Créditos.');
       console.log(socket, 'q|quit - Salir del programa.');
    rl.prompt();
};


//muestra una lista de las preguntas que existen
exports.listCmd = (socket, rl) => {
    //antiguo
	//model.getAll().forEach((quiz, id) => {
	//	log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
	//});

    //rl.prompt();

    //nuevo
    models.quiz.findAll()  //cuando se cumpla la primesa devuelve todos los quizzes
    .each(quiz => {
     	   //imprimo el identificador, campo question
     		log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
     	})

    .catch(error => {
    	errorlog(socket, error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};

const makeQuestion = (socket, rl, text) => {
	return new Sequelize.Promise ((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};

//añade una pregunta a la lista
exports.addCmd = (socket, rl) => {
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
	
		log(socket, ` ${colorize('Se han añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(socket, error.message);
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
const validateId = (socket, id) => {
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
exports.showCmd = (socket, rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});

};

//borra un quiz de la lista
//@param id clave del quiz show 55a eleminar del modelo
exports.deleteCmd = (socket, rl, id) => {
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
exports.editCmd = (socket, rl, id) => {
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
		log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')}: por: ${quiz.question} ${colorize('=>', 'magenta' )} ${quiz.answer}`);	       
	})
	.catch(Sequelize.ValidationError, error =>{ //error de validacion
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

//prueba un quiz
//@param id clave del quiz a probar
//nuevo: validar id, acceder a la base de datos como en edit, y preguntar por la preg asociada al quiz y comprobar que este bien
exports.testCmd = (socket, rl, id) => {

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
					log (socket, 'Su respuesta es correcta. ');
					biglog (socket, 'Correcta', 'green');
				} else {
					log (socket, 'Su respuesta es incorrecta. ');
					biglog (socket, 'Incorrecta', 'red');
				}
			});
	})
	.catch(Sequelize.ValidationError, error =>{ //error de validacion
		errorlog(socket, 'El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});	
};

//va sacando preguntas en orden aleatorio. Se acaba si contestas a todo correctamente
//se pueden guardar en un array las preguntas de forma aleatoria, usar promesas
exports.playCmd = (socket, rl) => {
    let score = 0;
	let totalPreguntas = 0;
	let porResponder = [];

	


		//.then (() => {
		 	//let porResponder = totalPreguntas;
								/*	//enumeramos las que quedan por responder. Metemos los id existentes
									for( let i = 0; i < model.count(); i++){
										porResponder [i]=i;
								        //porResponder[i] = model.getByIndex(i);
									}*/
		/*	if(porResponder.lenght === 0){
				log('No quedan mas preguntas. Fin del juego', 'red');
			}else{
				playOne();
			}
		})
		.catch (error => {
			errorlog(error.message);
		})
		.then (() => {
			rl.prompt();
		});
	   */

	   //llenamos el array con todas las preguntas
        models.quiz.findAll()
				.then (quizzes => {
					quizzes.forEach ((quiz, id) => {
						 ++totalPreguntas;
						 porResponder.lenght = totalPreguntas;
					     porResponder.push(quiz.id);
				         }) //quizzers.foreach
						 
				})

	    const playOne = () => {
	    	//falta o falla algo ¿cuando se ponen los .then?
			if (porResponder===0) => {
				log('No hay mas que preguntar');
				log('Fin del juego. Aciertos:', score);
				biglog (score, 'magenta')
		    
			.then(() => {
				rl.prompt();
			});

		    }else{ //en cada vuelta restar 1 al porResponder;

				
			//1.generamos un id al azar
	            let id = Math.floor(Math.random()*(porResponder.lenght-score));//hace falta el -csore??
	         
				//validateId(id) // promesa para validar id
				//	.then(id => models.quiz.findById(id)) //promesa que busca la pregunta a editar por su id
                
                //asignamos quiz
                let quiz = porResponder [id];

                models.quiz.findById(porResponder[id])
					.then(quiz => {//pasa como parametro el quiz que ha encontrado
						if (!quiz) { // si no ha encontrado el quiz, id que no existe
							throw new Error (`No existe un quiz asociado al id=${id}.`);
						}else{
                
							//process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
							log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`); //imprime la pregunta
								return makeQuestion(rl, ' Introduzca la respuesta ') //edita el texto de la respuesta
								.then (a => {
									if (quiz.answer.toLowerCase() === a.toLowerCase()){
										score ++;
										//porResponder --;
										log (socket, `CORRECTO - Lleva ${score} aciertos.`, 'green');
		                       			biglog (socket, 'correcta', 'green');
		                       			porResponder.splice(id, 1);
		                        		playOne();
		                        		//if porREsponder es 0, promprt
									} else {
										log (socket, `INCORRECTO - HA CONSEGUIDO ${score} aciertos.`);
		                       			biglog (socket, 'correcta', 'green');
		                         		log (socket, `FIN`) //;
										rl.prompt();
									}
								}) //del then a
		
								/*.catch(Sequelize.ValidationError, error =>{ //error de validacion
									errorlog('El quiz es erroneo:');
									error.errors.forEach(({message}) => errorlog(message));
								})*/
								.catch(error => {
									errorlog(socket, error.message);
								})
								.then(() => {
				               			rl.prompt();
								});
				        }//del else
			        }); //del then quiz	
		    }//primer else	
	    };//playOne
}; //playcmds


//nombre del autor de la practica
exports.creditsCmd = (socket, rl) => {
        log(socket, 'Autor de la práctica');
        log(socket, 'ROCIO');
        rl.prompt();
};

//termina el programa
exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};

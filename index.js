//
//	Run using command:  pm2 start index.js -e err.log --name predictit --log-date-format 'DD-MM HH:mm:ss'
//  mongod --dbpath D:/workspace/predictitParser/db
//
var express = require('express');
var app = express();
var helmet = require('helmet');
var swig = require('pug');
var fs = require('fs');
var util = require('util');
var schedule = require('node-schedule');
// var colors = require('colors');
var moment = require('moment');
var bodyParser = require('body-parser');
var promise = require('q');
var queue = require('queue');

// INTERN SCRIPTS
var MongoUtils = require('./lib/mongo-utils');

// CONFIGURING EXPRESS TO SERVE
app.set('view cache', false);
app.set('view engine', 'pug')
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(helmet());
app.listen(4001);

app.get('/', function (req, res) {
	res.render('index',{settings:settings,totalWinnings:69});
});
app.get('/crawleradmin/balance/', function(req, res) {
    // var resume = {};
    // try{
    //     resume.total = balance.PrivReservedFunds.toFixed(0);
    //     resume.used = balance.PrivUsedFunds.toFixed(0);
    //     resume.winnings = filter.totalWinnings.toFixed(0);
    // } catch (err){
    //     resume.err = 'Not able to parse data';
    // }
    // return res.send(JSON.stringify(resume));
});

//SETTINGS THAT HOLDS INITIAL FILES AND STATUSES
var settings = {};

loadSettings();

function loadSettings(){
	try{
		settings = JSON.parse(fs.readFileSync("./data/settings.cfg"));
		console.log('Settings loaded successfully!');
	} catch (err){
		console.error('Error opening settings file!');
	}
}
function saveSettings(){
	fs.writeFile("./data/settings.cfg", JSON.stringify(settings, null, 2) , function(err) {
	    if(err) return console.error('Error saving settings file: ' + err);
	});
}

// var sweepRule = new schedule.RecurrenceRule();
// sweepRule.hour = [0,6,12,18];
// var updateRule = new schedule.RecurrenceRule();
// updateRule.minute = [5,10,15,20,25,30,35,40,45,50,55];
// updateRule.second = 0;

// startUpdateProcedure();

// var sw = schedule.scheduleJob(sweepRule, function(){
// 	startSweepProcedure();
// });

// var up = schedule.scheduleJob(updateRule, function(){
// 	startUpdateProcedure();
// });

function startSweepProcedure(){
	console.log('--------========= START SWEEPING ======--------------'.inverse.yellow);

	// MarketUtils.createHighestVolumeMarkets()
	// .catch(function(err){
	// 	console.error(err);
	// });
}

function startUpdateProcedure(){
	
	console.log('--------================ UPDATE ==================---------------'.inverse.yellow);

	// promise.all([MongoUtils.getBalance(),MarketUtils.getUSDTicker()])
	// .then(MongoUtils.getSportbetsOrders)
	// .catch(function(err){
	// 	console.error(err);
	// 	//updateLock = false;
	// });

}

var diagnosis = [];
var count=0;
function SaveAllDiagnosis(){
	var lineReader = require('readline').createInterface({
		input: fs.createReadStream('./data/rm_joelho.txt')
	});
	
	lineReader.on('line', function (line) {
		console.log("Reading diagnosis "+(count));
		count++;
		if(count!=1)
			diagnosis.push(line.split('\t'));
	});

	lineReader.on('close', function () {
		var q = queue();
		q.timeout = 100;
		q.concurrency = 1;
		console.log("Finished reading diagnosis.")

		// For each market opened
		diagnosis.forEach(function(diag){
			q.push(function(cb) {
				MongoUtils.SaveDiagnosis(diag)
				.then(function(res){
					console.log("Saved diagnosis.")
					cb();
				});
			});
		});
		q.start(function(err) {
			console.log('Finished saving diagnosis!'.green);
		});
		

	});
}

function PrintDiagnosisOnFile(){
	MongoUtils.getAllDiagnosis()
	.then(function(diagnosis){
		var result='';
		diagnosis.forEach(function(diag){
			diag.resultadoTxt.forEach(function(line){
				result += line+'\n';
			});
			result += '\n\n*********************************************************\n\n'
		});
		fs.writeFile("./data/allDiags.txt", result , function(err) {
			if(err) return console.error('Error saving diagnosis file: ' + err);
		});
	});
}

SaveAllDiagnosis();

/*
UMDI	14	PRACA MOGI DAS CRUZES	Sat Aug 11 16:07:56 BRT 2018	96246	10020484	39	M	21	RESSONANCIA	3562	RM JOELHO ESQUERDO	Mon Aug 13 15:58:53 BRT 2018	<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><title></title><style type="text/css">.cs95E872D0{text-align:left;text-indent:0pt;margin:0pt 0pt 0pt 0pt}.csD5D7D290{color:#000000;background-color:transparent;font-family:Arial;font-size:11pt;font-weight:normal;font-style:normal;}.cs2EA5D3A6{text-align:center;text-indent:0pt;margin:0pt 0pt 7pt 0pt}.csC57700C4{color:#000000;background-color:transparent;font-family:Arial;font-size:12pt;font-weight:bold;font-style:normal;}.csBDBE348C{text-align:justify;text-indent:0pt;margin:0pt 0pt 7pt 0pt}.cs31D24DEE{color:#000000;background-color:transparent;font-family:Arial;font-size:11pt;font-weight:bold;font-style:normal;}.csACEA4482{text-align:justify;text-indent:0pt;margin:0pt 0pt 5pt 0pt}.cs4DF2502E{color:#000000;background-color:transparent;font-family:Arial;font-size:9pt;font-weight:normal;font-style:italic;}.cs9FF1B611{color:#000000;background-color:transparent;font-family:Arial;font-size:9pt;font-weight:normal;font-style:normal;}</style></head><body><p class="cs95E872D0"><span class="csD5D7D290">&nbsp;</span></p><p class="cs2EA5D3A6"><span class="csC57700C4">RESSON&Acirc;NCIA MAGN&Eacute;TICA DE JOELHO ESQUERDO</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="cs31D24DEE">T&eacute;cnica:</span><span class="csD5D7D290"> Realizadas sequ&ecirc;ncias baseadas em aquisi&ccedil;&otilde;es de imagens spin-eco e com e sem supress&atilde;o do sinal da gordura nos diversos planos ortogonais, de acordo com o protocolo adequado para esse estudo. </span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="cs31D24DEE">An&aacute;lise das imagens:</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Estudo comparativo com o exame realizado em &nbsp;23.09.2017</span></p><p class="csBDBE348C"><span class="csD5D7D290">N&atilde;o h&aacute; mais sinais de fratura na cabe&ccedil;a da f&iacute;bula. </span></p><p class="csBDBE348C"><span class="csD5D7D290">Padr&atilde;o de edema no polo inferior da patela. </span></p><p class="csBDBE348C"><span class="csD5D7D290">Demais estruturas &oacute;sseas com morfologia, contornos e sinal de RM preservados.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Permanece a les&atilde;o/rotura &nbsp;no corpo, corno posterior e raiz posterior do menisco medial. </span></p><p class="csBDBE348C"><span class="csD5D7D290">Menisco lateral com morfologia, contornos e sinal de RM preservados.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Moderado edema / l&iacute;quido no tecido celular subcut&acirc;neo na face anterior e lateral do joelho.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Pequeno derrame articular.</span></p><p class="csBDBE348C"><span class="csD5D7D290">aumento das dimens&otilde;es do cisto &nbsp;de Baker, com indefini&ccedil;&atilde;o dos seus contornos, inferindo les&atilde;o/rotura. </span></p><p class="csBDBE348C"><span class="csD5D7D290">Persiste &nbsp;a entesopatia do quadr&iacute;ceps por&eacute;m h&aacute; &nbsp;sinais de rotura parcial de suas fibras e processo inflamat&oacute;rio das partes moles adajcentes. &nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">Ligamentos cruzados com orienta&ccedil;&atilde;o e sinal de RM normais.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Ligamentos colaterais com morfologia e sinal de RM normais.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Ligamento patelar &iacute;ntegro.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Grupos musculares com morfologia, contornos e sinal de RM normais.</span></p><p class="csBDBE348C"><span class="csD5D7D290">Peritendinite anserina. </span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;&nbsp;</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Impress&atilde;o diagn&oacute;stica de joelho esquerdo:</span></p><p class="csBDBE348C"><span class="cs31D24DEE">&nbsp;</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Estudo comparativo com o exame realizado em &nbsp;23.09.2017</span></p><p class="csBDBE348C"><span class="cs31D24DEE">N&atilde;o h&aacute; mais sinais de fratura na cabe&ccedil;a da f&iacute;bula. </span></p><p class="csBDBE348C"><span class="cs31D24DEE">Padr&atilde;o de edema no polo inferior da patela. </span></p><p class="csBDBE348C"><span class="cs31D24DEE">Permanece a les&atilde;o/rotura &nbsp;no corpo, corno posterior e raiz posterior do menisco medial. </span></p><p class="csBDBE348C"><span class="cs31D24DEE">Moderado edema / l&iacute;quido no tecido celular subcut&acirc;neo na face anterior e lateral do joelho.</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Pequeno derrame articular.</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Aumento das dimens&otilde;es do cisto &nbsp;de Baker, com indefini&ccedil;&atilde;o dos seus contornos, inferindo les&atilde;o/rotura. </span></p><p class="csBDBE348C"><span class="cs31D24DEE">Persiste &nbsp;a entesopatia do quadr&iacute;ceps, por&eacute;m h&aacute; sinais de rotura parcial de suas fibras e processo inflamat&oacute;rio das partes moles adajcentes. &nbsp;</span></p><p class="csBDBE348C"><span class="cs31D24DEE">Peritendinita anserina. </span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csBDBE348C"><span class="csD5D7D290">&nbsp;</span></p><p class="csACEA4482"><span class="cs4DF2502E">O exame foi analisado e armazenado de maneira digital (PACS) e documentado de maneira anal&oacute;gica.</span></p><p class="csACEA4482"><span class="cs9FF1B611">&nbsp;</span></p><p class="cs95E872D0"><span class="csD5D7D290">&nbsp;</span></p><p class="cs95E872D0"><span class="csD5D7D290">&nbsp;</span></p></body></html>	{\rtf1\deff0{\fonttbl{\f0 Arial;}}{\colortbl ;\red0\green0\blue255 ;\red0\green0\blue0 ;}{\*\defchp \fs22}{\stylesheet {\ql\fs22 Normal;}{\*\cs1\fs22 Default Paragraph Font;}{\*\cs2\sbasedon1\fs22 Line Number;}{\*\cs3\ul\fs22\cf1 Hyperlink;}{\*\ts4\tsrowd\fs22\ql\tscellpaddfl3\tscellpaddl108\tscellpaddfb3\tscellpaddfr3\tscellpaddr108\tscellpaddft3\tsvertalt\cltxlrtb Normal Table;}{\*\ts5\tsrowd\sbasedon4\fs22\ql\trbrdrt\brdrs\brdrw10\trbrdrl\brdrs\brdrw10\trbrdrb\brdrs\brdrw10\trbrdrr\brdrs\brdrw10\trbrdrh\brdrs\brdrw10\trbrdrv\brdrs\brdrw10\tscellpaddfl3\tscellpaddl108\tscellpaddfr3\tscellpaddr108\tsvertalt\cltxlrtb Table Simple 1;}}{\*\listoverridetable}{\info{\author S\u244\'f4nia de Aguiar Vilela Mitraud}{\creatim\yr2018\mo8\dy13\hr15\min58}{\version1}}\nouicompat\splytwnine\htmautsp\sectd\marglsxn850\margtsxn1417\margbsxn850\pgwsxn11906\pghsxn16838{\headerr\pard\plain\ql\fs22\par}{\footerr\pard\plain\ql\fs22\par}\pard\plain\ql\fs22\par\pard\plain\qc\sa140{\b\cf2 RESSON\u194\'c2NCIA MAGN\u201\'c9TICA DE JOELHO }{\lang1046\langfe1046\b\cf2 ESQUERDO}\b\par\pard\plain\qj\sa140\fs22\par\pard\plain\qj\sa140{\b\fs22\cf2 T\u233\'e9cnica:}{\fs22\cf2  Realizadas sequ\u234\'eancias baseadas em aquisi\u231\'e7\u245\'f5es de imagens spin-eco e com e sem supress\u227\'e3o do sinal da gordura nos diversos planos ortogonais, de acordo com o protocolo adequado para esse estudo. }\fs22\par\pard\plain\qj\sa140\fs22\par\pard\plain\qj\sa140{\b\fs22\cf2 An\u225\'e1lise das imagens:}\b\fs22\cf2\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf0 Estudo comparativo com o exame realizado em  23.09.2017}\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 N\u227\'e3o h\u225\'e1 mais sinais de fratura na cabe\u231\'e7a da f\u237\'edbula. }\lang1046\langfe1046\fs22\cf2\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Padr\u227\'e3o de edema no polo inferior da patela. }\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Demais estruturas \u243\'f3sseas com morfologia, contornos e sinal de RM preservados.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Permanece a les\u227\'e3o/rotura  no corpo, corno posterior e raiz posterior do menisco medial. }\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Menisco lateral com morfologia, contornos e sinal de RM preservados.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Moderado edema / l\u237\'edquido no tecido celular subcut\u226\'e2neo na face anterior e lateral do joelho.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Pequeno derrame articular.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 aumento das dimens\u245\'f5es do cisto \~de Baker, com indefini\u231\'e7\u227\'e3o dos seus contornos, inferindo les\u227\'e3o/rotura. }\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Persiste  a entesopatia do quadr\u237\'edceps por\u233\'e9m h\u225\'e1  sinais de rotura parcial de suas fibras e processo inflamat\u243\'f3rio das partes moles adajcentes.  }\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Ligamentos cruzados com orienta\u231\'e7\u227\'e3o e sinal de RM normais.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Ligamentos colaterais com morfologia e sinal de RM normais.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Ligamento patelar \u237\'edntegro.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Grupos musculares com morfologia, contornos e sinal de RM normais.}\lang1046\langfe1046\fs22\cf2\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 Peritendinite anserina. }\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~\~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Impress\u227\'e3o diagn\u243\'f3stica de joelho esquerdo:}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf0 Estudo comparativo com o exame realizado em  23.09.2017}\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 N\u227\'e3o h\u225\'e1 mais sinais de fratura na cabe\u231\'e7a da f\u237\'edbula. }\lang1046\langfe1046\b\fs22\cf2\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Padr\u227\'e3o de edema no polo inferior da patela. }\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Permanece a les\u227\'e3o/rotura  no corpo, corno posterior e raiz posterior do menisco medial. }\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Moderado edema / l\u237\'edquido no tecido celular subcut\u226\'e2neo na face anterior e lateral do joelho.}\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Pequeno derrame articular.}\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Aumento das dimens\u245\'f5es do cisto \~de Baker, com indefini\u231\'e7\u227\'e3o dos seus contornos, inferindo les\u227\'e3o/rotura. }\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Persiste  a entesopatia do quadr\u237\'edceps, por\u233\'e9m h\u225\'e1 sinais de rotura parcial de suas fibras e processo inflamat\u243\'f3rio das partes moles adajcentes.  }\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\b\fs22\cf2 Peritendinita anserina. }\lang1046\langfe1046\b\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa140{\lang1046\langfe1046\fs22\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa100{\lang1046\langfe1046\i\fs18\cf2 O exame foi analisado e armazenado de maneira digital (PACS) e documentado de maneira anal\u243\'f3gica.}\lang1046\langfe1046\fs22\par\pard\plain\qj\sa100{\lang1046\langfe1046\fs18\cf2 \~}\lang1046\langfe1046\fs22\par\pard\plain\ql\lang1046\langfe1046\fs22\par\pard\plain\ql\fs22}

*/
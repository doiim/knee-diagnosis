var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var DiagnosisSchema   = new Schema({
	Marca: String,	
	idUnidade: Number,
	Unidade: String,	
	dataExame: { type: Date, default: null },	
	numAtendimento:	Number,
	idProntuario: Number,
	Idade: Number,
	Sexo: String,
	idEspecialidade: Number,
	Especialidade: String,
	idExame: Number,
	Exame: String,
	dataLaudo: { type: Date, default: null },
	resultadoHtml: String,
	resultadoTxt: [String],
	symptomList: [String],
	resultList: [String]
    // id: { type : String , unique : true, dropDups: true },
	// structure: [{type: Schema.Types.Mixed, default: {}}],		// MARCAR .markModified('externalJSON') para atualizar

});

module.exports = mongoose.model('Diagnosis', DiagnosisSchema);

/*    --------_Example Data ---------
CDI
18
CDI VITORIA
Fri Jun 01 12:00:37 BRT 2018
36646
10437587
48
F
21
RESSONANCIA
3562
RM JOELHO ESQUERDO
Tue Jun 05 08:30:11 BRT 2018
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><title></title><style type="text/css">.cs95E872D0{text-align:left;text-indent:0pt;margin:0pt 0pt 0pt 0pt}.cs9AEB0B62{color:#000000;background-color:transparent;font-family:Arial;font-size:8.5pt;font-weight:normal;font-style:normal;}.cs31D24DEE{color:#000000;background-color:transparent;font-family:Arial;font-size:11pt;font-weight:bold;font-style:normal;}.csD5D7D290{color:#000000;background-color:transparent;font-family:Arial;font-size:11pt;font-weight:normal;font-style:normal;}.csE48F72D0{text-align:left;text-indent:0pt;margin:0pt 0pt 5pt 0pt}.cs43C038A{color:#000000;background-color:transparent;font-family:Arial;font-size:11pt;font-weight:normal;font-style:italic;}</style></head><body><p class="cs95E872D0"><span class="cs9AEB0B62">&nbsp;</span></p><p class="cs95E872D0"><span class="cs31D24DEE">&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;RESSON&Acirc;NCIA MAGN&Eacute;TICA DO JOELHO ESQUERDO</span></p><p class="cs95E872D0"><span class="csD5D7D290">&nbsp;</span></p><p class="csE48F72D0"><span class="cs31D24DEE">&nbsp;</span></p><p class="csE48F72D0"><span class="cs31D24DEE">T&Eacute;CNICA:</span></p><p class="csE48F72D0"><span class="csD5D7D290">Exame realizado em aparelho de alto campo (1,5T), atrav&eacute;s da t&eacute;cnica </span><span class="cs43C038A">fast spin echo</span><span class="csD5D7D290">, sendo obtidas imagens ponderadas em T1, DP e T2, em aquisi&ccedil;&atilde;o multiplanar.</span></p><p class="csE48F72D0"><span class="cs31D24DEE">RELAT&Oacute;RIO:</span></p><p class="csE48F72D0"><span class="csD5D7D290">Incipiente osteofitose marginal patelofemoral.<br/>Interlinhas articulares femorotibiais preservadas com cartilagens de revestimento &iacute;ntegras.<br/>Meniscos medial e lateral sem altera&ccedil;&otilde;es significativas.<br/>Ligamentos cruzados e colaterais &iacute;ntegros.<br/>Tendinopatia leve do quadr&iacute;ceps junto &agrave; inser&ccedil;&atilde;o patelar.<br/>Demais estruturas tend&iacute;neas e retin&aacute;culos patelares com espessura e sinal habituais.<br/>Patela t&oacute;pica.<br/>Afilamento irregular e anomalia do sinal do revestimento condral da patela com focos t&ecirc;nues de edema &oacute;sseo medular subjacentes.<br/>Afilamento irregular do revestimento condral da tr&oacute;clea femoral com pequena &aacute;rea de desnudamento junto ao sulco.<br/>Pequeno derrame articular.<br/>Discreto edema da por&ccedil;&atilde;o superolateral da gordura de Hoffa.<br/>N&atilde;o h&aacute; cisto popl&iacute;teo.<br/>Ventres musculares visibilizados sem evid&ecirc;ncias de les&otilde;es.<br/>Edema do tecido celular subcut&acirc;neo da face anterior do joelho.</span></p><p class="csE48F72D0"><span class="cs31D24DEE">IMPRESS&Atilde;O:</span></p><p class="cs95E872D0"><span class="csD5D7D290">Sinais de artrose patelofemoral, destacando-se condropatia patelar grau IV e da tr&oacute;clea femoral grau III.<br/>N&atilde;o h&aacute; evid&ecirc;ncias de les&atilde;o meniscal ou ligamentar.<br/>Tendinopatia leve do quadr&iacute;ceps junto &agrave; inser&ccedil;&atilde;o patelar.<br/>Pequeno derrame articular.<br/>Discreto edema da por&ccedil;&atilde;o superolateral da gordura de Hoffa, devendo estar relacionado &agrave; hiperssolicita&ccedil;&atilde;o do mecanismo extensor.<br/>Edema do tecido celular subcut&acirc;neo da face anterior do joelho. </span></p><p class="cs95E872D0"><span class="csD5D7D290">&nbsp;</span></p></body></html>
{\rtf1\deff0{\fonttbl{\f0 Arial;}}{\colortbl ;\red0\green0\blue255 ;\red0\green0\blue0 ;}{\*\defchp \fs22}{\stylesheet {\ql\fs22 Normal;}{\*\cs1\fs22 Default Paragraph Font;}{\*\cs2\sbasedon1\fs22 Line Number;}{\*\cs3\ul\fs22\cf1 Hyperlink;}{\*\ts4\tsrowd\fs22\ql\tscellpaddfl3\tscellpaddl108\tscellpaddfb3\tscellpaddfr3\tscellpaddr108\tscellpaddft3\tsvertalt\cltxlrtb Normal Table;}{\*\ts5\tsrowd\sbasedon4\fs22\ql\trbrdrt\brdrs\brdrw10\trbrdrl\brdrs\brdrw10\trbrdrb\brdrs\brdrw10\trbrdrr\brdrs\brdrw10\trbrdrh\brdrs\brdrw10\trbrdrv\brdrs\brdrw10\tscellpaddfl3\tscellpaddl108\tscellpaddfr3\tscellpaddr108\tsvertalt\cltxlrtb Table Simple 1;}}{\*\listoverridetable}{\info{\author Oswaldo Junior}{\creatim\yr2018\mo6\dy5\hr8\min30}{\version1}}\nouicompat\splytwnine\htmautsp\sectd\marglsxn567\margrsxn567\margtsxn1531\margbsxn1701\pgwsxn11906\pghsxn16838{\headerr\pard\plain\ql\fs22\par}{\footerr\pard\plain\ql\fs22\par}\pard\plain\ql\fs17\par\pard\plain\ql{\lang1046\langfe1046\b\fs22\cf2                                          }{\b\fs22\cf2 RESSON\u194\'c2NCIA MAGN\u201\'c9TICA DO JOELHO ESQUERDO}\b\fs22\par\pard\plain\ql\fs22\par\pard\plain\ql\sa100\b\fs22\cf2\par\pard\plain\ql\sa100{\b\fs22\cf2 T\u201\'c9CNICA:}\b\fs22\par\pard\plain\ql\sa100{\fs22\cf2 Exame realizado em aparelho de alto campo (1,5T), atrav\u233\'e9s da t\u233\'e9cnica }{\i\fs22\cf2 fast spin echo}{\fs22\cf2 , sendo obtidas imagens ponderadas em T1, DP e T2, em aquisi\u231\'e7\u227\'e3o multiplanar.}\fs22\par\pard\plain\ql\sa100{\b\fs22\cf2 RELAT\u211\'d3RIO:}\b\fs22\par\pard\plain\ql\sa100{\fs22\cf2 Incipiente osteofitose marginal patelofemoral.\line Interlinhas articulares femorotibiais preservadas com cartilagens de revestimento \u237\'edntegras.\line Meniscos medial e lateral sem altera\u231\'e7\u245\'f5es significativas.\line Ligamentos cruzados e colaterais \u237\'edntegros.\line Tendinopatia leve do quadr\u237\'edceps junto }{\lang1046\langfe1046\fs22\cf2 \u224\'e0}{\fs22\cf2  inser\u231\'e7\u227\'e3o patelar.\line Demais estruturas tend\u237\'edneas e retin\u225\'e1culos patelares com espessura e sinal habituais.\line Patela }{\lang1046\langfe1046\fs22\cf2 t\u243\'f3pica}{\fs22\cf2 .\line Afilamento irregular e anomalia do sinal do revestimento condral da patela com focos }{\lang1046\langfe1046\fs22\cf2 t\u234\'eanues}{\fs22\cf2  de edema \u243\'f3sseo medular subjacentes.\line Afilamento irregular do revestimento condral da tr\u243\'f3clea femoral com pequena \u225\'e1rea de desnudamento junto ao sulco.\line Pequeno derrame articular.\line Discreto edema da por\u231\'e7\u227\'e3o s}{\lang1046\langfe1046\fs22\cf2 u}{\fs22\cf2 perolateral da gordura de Hoffa.\line N\u227\'e3o h\u225\'e1 cisto popl\u237\'edteo.\line Ventres musculares visibilizados sem evid\u234\'eancias de les\u245\'f5es.\line Edema do tecido celular subcut\u226\'e2neo da face anterior do joelho.}\fs22\par\pard\plain\ql\sa100{\b\fs22\cf2 IMPRESS\u195\'c3O:}\b\fs22\par\pard\plain\ql{\fs22\cf2 Sinais de artrose patelofemoral, destacando-se condropatia patelar grau IV e da tr\u243\'f3clea femoral grau III.\line N\u227\'e3o h\u225\'e1 evid\u234\'eancias de les\u227\'e3o meniscal ou ligamentar.\line Tendinopatia leve do quadr\u237\'edceps junto }{\lang1046\langfe1046\fs22\cf2 \u224\'e0}{\fs22\cf2  inser\u231\'e7\u227\'e3o patelar.\line Pequeno derrame articular.\line Discreto edema da por\u231\'e7\u227\'e3o s}{\lang1046\langfe1046\fs22\cf2 u}{\fs22\cf2 perolateral da gordura de Hoffa, devendo estar relacionado }{\lang1046\langfe1046\fs22\cf2 \u224\'e0}{\fs22\cf2  hipers}{\lang1046\langfe1046\fs22\cf2 s}{\fs22\cf2 olicita\u231\'e7\u227\'e3o do mecanismo extensor.\line Edema do tecido celular subcut\u226\'e2neo da face anterior do joelho. }\par\pard\plain\ql\fs22}                                                                                                                                                                                                                                                       

*/

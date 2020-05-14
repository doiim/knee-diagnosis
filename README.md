Resultados do Preditor de Diagnósticos
Método:
O trabalho foi realizado em 3 semanas. Destas mais de 50% do tempo foi usado implementando o módulo NLP e construindo ferramentas pra facilitar o cadastro de exemplos para aumentar sua precisão. Do restante do tempo em torno de 30% foi gasto na implementação do PREDITOR MULTILABEL e o restante gasto nas outras partes do software.
Funcionamento do Software:

1 - LEITURA - Os dados foram todos salvos em um BD. Há uma primeira etapa na qual extraímos o conteúdo dos campos html e transformamos num grande texto.

2 - FORMATAÇÃO - O texto é separado em linhas usando pontuação simples. Tratamos apenas um caso especial em que dentro do texto uma data usava pontuação, para que essa não cortasse a frase no meio.

3 - NLP - Com o texto separado em frase jogamos essas frases num módulo de NLP (Natural Language Processing) para que este converta as frases em conjuntos de tags. O NLP precisa de exemplos pra funcionar, então geramos um módulo para analisar quais frases não estavam com bom resultado afim de ir preenchendo as lacunas até todas satisfazerem um mínimo de resultado. Foram gerados cerca de 300 exemplos com 150 tokens diferentes para que o módulo funcionasse minimamente. Quando o módulo não acha a classificação, ele classifica a frase com valor 0.5 para todos os tokens existentes, o mínimo foi certificar que nenhuma frase possuísse um resultado desse.

4 - BUSCA DOS RESULTADOS - Agora com os tokens, rodamos uma rotina pra procurar pelo token “diagnostico” e definir quais frases representavam sintomas e quais representavam resultados e dessa forma separá-los em dois campos. Isso porque nem todos os diagnósticos tinham um padrão claro. Assim usando os que conseguimos classificar, procuramos ocorrência destes em outros diagnósticos que não estavam classificados.

5 - PREDIÇÃO - Agora separados transformamos esses tokens em números e jogamos como exemplo para um preditor multilabel, capaz de identificar para cada configuração (tokens de sintomas) qual as melhores classes resultantes (tokens de resultados). Limitamos a análise a 20 frases e no máximo 8 tokens por frase, pegando apenas os principais. E como resultado, apenas 3 frases e 3 tokens por frase. O que já é razoável, pois no resultado atual do NLP obtemos uma média de 4 ou 5 tokens representando uma frase.

6 - BUSCA DE FRASES - Após uma predição, os números são convertidos em tokens novamente e buscamos em todos os diagnósticos as frases que mais se aproximem daquela sequência de tokens para exibi-las como resultado.

Resultados obtidos:

1 e 2 - As fases de LEITURA e FORMATAÇÃO estão com resultados satisfatórios sem grandes melhorias. Houveram pequenas configurações de dados que quebraram algumas frases de maneira errada, não representam nem 1% do total das frases, e antes da fase de tokens bastante dessas anomalias foram filtradas. Isso também não gera grandes problemas pois ao chegar no NLP as frases são transformadas em tokens e isso gerará apenas uma perda de alguns tokens em uma frase num diagnóstico com várias frases, que no treinamento final multilabel, isso fica diluído.

3 - O módulo NLP funcionou muito bem com poucos exemplos. Aumentar as frases de exemplo produzirá uma melhoria bastante significativa no desempenho, pois ele poderá pegar mais frases com melhor precisão. De todas as frases 20% foi classificada como um token só e 80% com mais de um token. 65% obteve uma classificação com precisão maior que 90%, 30% obteve classificação melhor que 70% e apenas 5% classificação menor que 70%. Isso significa que o módulo, com os exemplos que tem, teve certeza, não necessariamente que uma frase classificada com 90% está correta. 20% classificada com um token só é um alerta, pois uma frase só deveria ser classificada com um token só se for curta demais, o que não é o caso. Uma melhoria seria elaborar uma avaliação melhor de como as classificações estão sendo feitas. Esta parte é o primeiro gargalo no erro das predições, visto que ao melhorar os resultados aqui, mais tokens e tokens diferentes serão passados para as próximas etapas o que pode mudar totalmente os resultados, principalmente da predição multilabel.

4 - Esta foi uma etapa que poderia ter sido evitada se todos os dados apresentassem um padrão legível pela máquina. Com a melhoria dos tokens obtidos na fase anterior essa fase ficará mais precisa, pois frases que antes estariam sendo consideradas iguais por ter uma mesma sequência de tokens, passariam a ser diferenciadas. Não foi possível mensurar o impacto de erro dessa fase mas acho que seja algo considerável e que é perfeitamente passível de melhoria.

5 - O modelo é treinado nessa fase de modo que a perda calculada iniciou-se em 3.2 e terminamos o processo em 1.8 em questão de meia hora de treinamento. Ao esperar mais podemos chegar em 1.6 de perda. Maiores investigações podem gerar melhores resultados, e ainda há a possibilidade de dividir o treinamento em vários módulos especializados de modo que pode diminuir ainda mais o erro. Com a melhoria da etapa de NLP a precisão dessa etapa aumentará ainda mais devido a separação correta das classes (tokens). Os números de tokens preditos e usados em predição ainda podem ser aumentados com a melhoria da precisão desse módulo.

6 - Assim como a etapa 4, a precisão dessa etapa melhora consideravelmente com a melhoria da etapa de NLP.

Para demonstrar o funcionamento das etapas de NLP, PREDIÇÃO e BUSCA DE FRASES, imprimimos também os tokens. Assim, a análise da frase se relacionando à lista de tokens demonstra como o NLP funcionou, a análise da lista de entrada de tokens com a lista de saída de tokens demonstra como a PREDIÇÃO funcionou, e por fim, a análise dos tokens de saída se relacionando com as frases preditas, demonstra como a busca de frases funcionou.

Exemplo:

ESPERADO TOKENS
T1 --- T2 --- manipulaçao_cirurgica --- ok --- 
menisco --- medial --- ok --- 
menisco --- lateral --- ok --- 
RESULTADO TOKENS
T1 --- T2 --- manipulaçao_cirurgica --- 
manipulaçao_cirurgica --- manipulaçao_cirurgica --- menisco --- 
menisco --- ligamento --- ok --- 
ESPERADO FRASES
- Exame realizado pela técnica Fast-Spin-Eco, com imagens ponderadas em T1 e T2, sem a administração do meio de contraste paramagnético
- Restante menisco medial com morfologia e sinal preservados
- Menisco lateral com morfologia e sinal preservados
RESULTADO FRASES
- O corno anterior remanescente apresenta alteração de sinal em T2 podendo estar relacionado a alterações degenerativas/cirúrgicas
- Alteração degenerativa inicial em ambos os meniscos
- Menisco lateral íntegro

Podemos ver nas frases esperadas, a primeira frase que não deveria ser classificada como resultado mas que o foi devido a estratégia adotada na etapa de BUSCA DOS RESULTADOS. Isso porque provavelmente alguma outra frase que foi classificada pelos mesmos tokens foi classificada como resultado.

Comparando as frases esperadas com os tokens esperados podemos ver como a classificação NLP está precisa com poucos exemplos. O único erro a ser notado é a incorreta classificação do token “manipulacao_cirurgica” provavelmente devido às palavras exame e administração na frase. 

Agora comparando as duas listas de tokens podemos ver a precisão da fase de PREDIÇÃO. Lembrando que os resultados estão limitados a 3 frases de 3 tokens. A primeira frase foi 100% de acerto, a segunda acertou apenas um token e a terceira dois tokens.

Conclusão:
Foi possível construir um modelo simples mas que já demonstra grande potencial, visto que já demonstra um mínimo de resultados e que várias melhorias podem ser agregadas ainda se for empregado tempo e esforço ao software.

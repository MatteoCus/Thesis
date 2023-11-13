#!/bin/bash
# Funzioni

 # containsElement: controlla se la stringa passata come primo parametro ha un valore incluso nell'array passato come secondo parametro:
 #                      se vi è successo ritorna 1
 set +e #otherwise the script will exit on error
 containsElement () {
   local e match="$1"
   shift
   for e; do [[ "$e" = "$match" ]] && return 1; done
   return 0
 }

 #removeElements: rimuove dall'array passato come secondo parametro tutti i file che rispettano l'espressione in ingresso nel primo parametro
 removeElements() {
      expression="$1";
      shift
      deletable=("$@")
      len=${#deletable[@]}

      for (( c=len-1; c>=0; c-- ))
      do
            if [[ "${deletable[$c]}" =~ $expression ]]; then

                  unset "deletable[c]";
            fi
      done
 }

#leaveElements: rimuove dall'array passato come secondo parametro tutti i file che NON rispettano l'espressione in ingresso nel primo parametro
 leaveElements() {
      expression="$1";
      shift
      deletable=("$@")
      len=${#deletable[@]}

      for (( c=len-1; c>=0; c-- ))
      do
            if [[ ! "${deletable[$c]}" =~ "$expression" ]]; then
                  unset "deletable[c]";
            fi
      done
 }

# isRecursive: verifica se il vettore di stringhe passato come primo parametro contiene valori che indicano che la ricerca di file da eliminare debba essere ricorsiva
isRecursive(){
      recursiveParameters=("-r" "--recursive")
      arguments=("$@")
      len=${#arguments[@]}
      rec=0;
      iterationResult=0;
      for element in "${arguments[@]}"
      do
            containsElement "$element" "${recursiveParameters[@]}";
            iterationResult=$?;
            rec=$(( rec+iterationResult ));
      done
      return $rec
}

# helpWanted: verifica se l'utente vuole visualizzare il messaggio di aiuto intenzionalmente
helpWanted(){
      helpParameters=("-h" "--help")
      arguments=("$@")
      len=${#arguments[@]}
      help=0;
      iterationResult=0;
      for element in "${arguments[@]}"
      do
            containsElement "$element" "${helpParameters[@]}";
            iterationResult=$?;
            help=$(( help+iterationResult ));
      done
      return $help
}

# mantainPDF: verifica se l'utente vuole eliminare i file pdf
mantainPDF(){
      pdfParameters=("--no-pdf")
      arguments=("$@")
      len=${#arguments[@]}
      pdf=0;
      iterationResult=0;
      for element in "${arguments[@]}"
      do
            containsElement "$element" "${pdfParameters[@]}";
            iterationResult=$?;
            pdf=$(( pdf+iterationResult ));
      done
      return $pdf
}

# printHelper: stampa un messaggio di aiuto
printHelper(){
echo "cleanup.sh [DIRECTORY|--all] [PARAMETERS]

Pulisce la directory specificata dai file temporanei di LaTeX

[DIRECTORY|--all]  (obbligatorio) specifica la directory da pulire
--no-pdf           (facoltativo) ignora il file PDF generato
--recursive -r     (facoltativo) pulisci ricorsivamente le directory
--help -h          Mostra questo messaggio"
}

 # validateInput: controlla se lo script è richiamato nel modo corretto, ovvero indicando se i file da eliminare sono locali ad un folder o
 #                generali; è passato come array l'insieme degli argomenti di invocazione dello script
  validateInput() {
      # casi di errore:
      #     1. Se il primo parametro non è una directory o --all
      #     2. Se i parametri dopo il primo non sono compresi in -r --recursive -h --help --no-pdf
      #     3. Se c'è il parametro -h (o --help) non possono esserci altri parametri (oltre a -h o --help)
      #     4. Se sono presenti più di una volta degli argomenti con stesso significato (per richiamare la funzione di help, per la ricorsione, per rimuovere i pdf)

      availableDirectories=$(find . -not -path "./.*" -and -not -path "." -and -not -path "*Immagini*" -and -not -path "*Common*" -and -not -path "*Grafici*" -type d);
      availableDirectories="${availableDirectories//'./'}";
      aux="${availableDirectories[0]}";
      declare -a availableFirstParameter;
      for element in $aux
      do
            availableFirstParameter+=("$element");
      done
      availableFirstParameter+=("--all");
      containsElement "$1" "${availableFirstParameter[@]}";
      firstTest=$?;

      shift

      availableParameters=("--no-pdf" "-r" "--help" "-h" "--recursive" "");
      input=("$@");
      secondTest=1;
      noPDF=0;
      recursive=0;
      help=0;
      for parameter in "${input[@]}"
      do
            containsElement "$parameter" "${availableParameters[@]}";
            internalTest=$?;
            if [ $internalTest = 0 ]; then
                  secondTest=0;
                  break
            elif [ "$parameter" = "--no-pdf" ]; then
                  ((noPDF++));
            elif [[ "$parameter" = "-r" ]] || [[ "$parameter" = "--recursive" ]]; then
                  ((recursive++));
            elif [[ "$parameter" = "-h" ]] || [[ "$parameter" = "--help" ]]; then
                  ((help++));
            fi
      done
      thirdTest=1;
      aux=$(( recursive+noPDF ));

      if [[ $help -gt 1 ]] || [[ $recursive -gt 1 ]] || [[ $noPDF -gt 1 ]] || [[ $help = 1 && $aux -gt 0 ]]; then
            thirdTest=0;
      fi

      result=$(( firstTest*secondTest*thirdTest ));
      return $result;
 }

 ## MAIN

arguments=("$@");
declare -a argumentsArray;
for element in "${arguments[@]}"
do
      argumentsArray+=("$element");
done

validateInput "${arguments[@]}";
valid=$?

exitValue=0;

if [ "$valid" = 0 ]
then
      echo "I parametri passati non rispettano le regole!"
      echo ""
      printHelper
      exitValue=1;
else
      deletable=( $(find ./ -name "*.toc" -or -name "*.lol" -or -name "*.aux" -or -name "*.fdb_latexmk" -or -name "*.fls" -or -name "*.lof" -or -name "*.log" -or -name "*.lot" -or -name "*.out" -or -name "*.synctex.gz" -or -name "*.pdf" -and -not -path "*Common*" -and -not -path "*Immagini*"  -and -not -path "*Grafici*" -type f) );


      #  Check cartella selezionata
      if [[ ${argumentsArray[0]} != "--all" ]]; then
            leaveElements "${argumentsArray[0]}" "${deletable[@]}"
      fi

      # Check richiesta aiuto
      helpWanted "${argumentsArray[@]}";
      help=$?
      if [[ $help == 1 ]]; then
            printHelper
      fi

      # Check ricorsione
      isRecursive "${argumentsArray[@]}";
      rec=$?
      if [[ $rec == 0 ]]; then
            if [[ ${argumentsArray[0]} != "--all" ]]; then
                  removeElements "^.[\/]${argumentsArray[0]}[\/][a-zA-Z0-9]+[\/][a-zA-Z0-9_]+[\.][a-zA-Z_\.]+$" "${deletable[@]}"
            else
                  removeElements "^.[\/][a-zA-Z0-9]+[\/][a-zA-Z0-9]+[\/][a-zA-Z0-9_]+[\.][a-zA-Z_\.]+$" "${deletable[@]}"
            fi
      fi

      # Check pdf
      mantainPDF "${argumentsArray[@]}";
      pdf=$?
      if [[ $pdf == 1 ]]; then
            removeElements "pdf" "${deletable[@]}"
      fi
fi

if [ "${#deletable[@]}" -eq 0 ]
then
      echo "Non ci sono file da cancellare!"

else
      rm -v ${deletable[@]}
fi

exit $exitValue

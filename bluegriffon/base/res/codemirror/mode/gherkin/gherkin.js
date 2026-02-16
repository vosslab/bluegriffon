// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/5/LICENSE

/*
Gherkin mode - http://www.cukes.info/
Report bugs/issues here: https://github.com/codemirror/CodeMirror/issues
*/

// Following Objs from Brackets implementation: https://github.com/tregusti/brackets-gherkin/blob/master/main.js
//var Quotes = {
//  SINGLE: 1,
//  DOUBLE: 2
//};

//var regex = {
//  keywords: /(Feature| {2}(Scenario|In order to|As|I)| {4}(Given|When|Then|And))/
//};

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("gherkin", function () {
  return {
    startState: function () {
      return {
        lineNumber: 0,
        tableHeaderLine: false,
        allowFeature: true,
        allowBackground: false,
        allowScenario: false,
        allowSteps: false,
        allowPlaceholders: false,
        allowMultilineArgument: false,
        inMultilineString: false,
        inMultilineTable: false,
        inKeywordLine: false
      };
    },
    token: function (stream, state) {
      if (stream.sol()) {
        state.lineNumber++;
        state.inKeywordLine = false;
        if (state.inMultilineTable) {
            state.tableHeaderLine = false;
            if (!stream.match(/\s*\|/, false)) {
              state.allowMultilineArgument = false;
              state.inMultilineTable = false;
            }
        }
      }

      stream.eatSpace();

      if (state.allowMultilineArgument) {

        // STRING
        if (state.inMultilineString) {
          if (stream.match('"""')) {
            state.inMultilineString = false;
            state.allowMultilineArgument = false;
          } else {
            stream.match(/.*/);
          }
          return "string";
        }

        // TABLE
        if (state.inMultilineTable) {
          if (stream.match(/\|\s*/)) {
            return "bracket";
          } else {
            stream.match(/[^\|]*/);
            return state.tableHeaderLine ? "header" : "string";
          }
        }

        // DETECT START
        if (stream.match('"""')) {
          // String
          state.inMultilineString = true;
          return "string";
        } else if (stream.match("|")) {
          // Table
          state.inMultilineTable = true;
          state.tableHeaderLine = true;
          return "bracket";
        }

      }

      // LINE COMMENT
      if (stream.match(/#.*/)) {
        return "comment";

      // TAG
      } else if (!state.inKeywordLine && stream.match(/@\S+/)) {
        return "tag";

      // FEATURE
      } else if (!state.inKeywordLine && state.allowFeature && stream.match(/(機能|功能|フィーチャ|기능|โครงหลัก|ความสามารถ|ความตองการทางธรกิจ|ಹೆಚಚಳ|గుణము|ਮੁਹਾਂਦਰਾ|ਨਕਸ ਨੁਹਾਰ|ਖਾਸੀਅਤ|रूप लेख|ویژگی|خاصية|תכונה|Функціонал|Функция|Функционалност|Функционал|Үзенчәлеклелек|Своиство|Особина|Мөмкинлек|Могућност|Λειτουργια|Δυνατοτητα|Własciwosc|Vlastnost|Trajto|Tinh nang|Savybe|Pretty much|Poziadavka|Pozadavek|Potrzeba biznesowa|Ozellik|Osobina|Ominaisuus|Omadus|OH HAI|Mogucnost|Mogucnost|Jellemzo|Hwæt|Hwaet|Funzionalita|Funktionaliteit|Funktionalitat|Funkcja|Funkcionalnost|Funkcionalitate|Funkcia|Fungsi|Functionaliteit|Functionalitate|Functionalitate|Functionalitate|Funcionalitat|Funcionalidade|Fonctionnalite|Fitur|Fica|Feature|Eiginleiki|Egenskap|Egenskab|Caracteristica|Caracteristica|Business Need|Aspekt|Arwedd|Ahoy matey!|Ability):/)) {
        state.allowScenario = true;
        state.allowBackground = true;
        state.allowPlaceholders = false;
        state.allowSteps = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // BACKGROUND
      } else if (!state.inKeywordLine && state.allowBackground && stream.match(/(背景|배경|แนวคิด|ಹಿನನೆಲೆ|నేపథయం|ਪਿਛੋਕੜ|पृषठभूमि|زمینه|الخلفية|רקע|Тарих|Предыстория|Предистория|Позадина|Передумова|Основа|Контекст|Кереш|Υποβαθρο|Załozenia|Yo\-ho\-ho|Tausta|Taust|Situacija|Rerefons|Pozadina|Pozadie|Pozadi|Osnova|Latar Belakang|Kontext|Konteksts|Kontekstas|Kontekst|Hatter|Hannergrond|Grundlage|Gecmis|Fundo|Fono|First off|Dis is what went down|Dasar|Contexto|Contexte|Context|Contesto|Cenario de Fundo|Cenario de Fundo|Cefndir|Boi canh|Bakgrunnur|Bakgrunn|Bakgrund|Baggrund|Background|B4|Antecedents|Antecedentes|Ær|Aer|Achtergrond):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // SCENARIO OUTLINE
      } else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景大綱|场景大纲|劇本大綱|剧本大纲|テンフレ|シナリオテンフレート|シナリオテンフレ|シナリオアウトライン|시나리오 개요|สรปเหตการณ์|โครงสรางของเหตการณ์|ವಿವರಣೆ|కథనం|ਪਟਕਥਾ ਰੂਪ ਰੇਖਾ|ਪਟਕਥਾ ਢਾਂਚਾ|परिदृशय रूपरेखा|سيناريو مخطط|الگوی سناریو|תבנית תרחיש|Сценарииның төзелеше|Сценарии структураси|Структура сценарію|Структура сценария|Структура сценарија|Скица|Рамка на сценарии|Концепт|Περιγραφη Σεναριου|Wharrimean is|Template Situai|Template Senario|Template Keadaan|Tapausaihio|Szenariogrundriss|Szablon scenariusza|Swa hwær swa|Swa hwaer swa|Struktura scenarija|Structura scenariu|Structura scenariu|Skica|Skenario konsep|Shiver me timbers|Senaryo taslagı|Schema dello scenario|Scenariomall|Scenariomal|Scenario Template|Scenario Outline|Scenario Amlinellol|Scenarijs pec parauga|Scenarijaus sablonas|Reckon it's like|Raamstsenaarium|Plang vum Szenario|Plan du Scenario|Plan du scenario|Osnova scenare|Osnova Scenara|Nacrt Scenaru|Nacrt Scenare|Nacrt Scenara|MISHUN SRSLY|Menggariskan Senario|Lysing Dæma|Lysing Atburðarasar|Konturo de la scenaro|Koncept|Khung tinh huong|Khung kich ban|Forgatokonyv vazlat|Esquema do Cenario|Esquema do Cenario|Esquema del escenario|Esquema de l'escenari|Esbozo do escenario|Delineacao do Cenario|Delineacao do Cenario|All y'all|Abstrakt Scenario|Abstract Scenario):/)) {
        state.allowPlaceholders = true;
        state.allowSteps = true;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // EXAMPLES
      } else if (state.allowScenario && stream.match(/(例子|例|サンフル|예|ชดของเหตการณ์|ชดของตัวอยาง|ಉದಾಹರಣೆಗಳು|ఉదాహరణలు|ਉਦਾਹਰਨਾਂ|उदाहरण|نمونه ها|امثلة|דוגמאות|Үрнәкләр|Сценарији|Примеры|Примери|Приклади|Мисоллар|Мисаллар|Σεναρια|Παραδειγ&micro;ατα|You'll wanna|Voorbeelden|Variantai|Tapaukset|Se þe|Se the|Se ðe|Scenarios|Scenariji|Scenarijai|Przykłady|Primjeri|Primeri|Priklady|Priklady|Piemeri|Peldak|Pavyzdziai|Paraugs|Ornekler|Juhtumid|Exemplos|Exemples|Exemple|Exempel|EXAMPLZ|Examples|Esempi|Enghreifftiau|Ekzemploj|Eksempler|Ejemplos|Du lieu|Dead men tell no tales|Dæmi|Contoh|Cenarios|Cenarios|Beispiller|Beispiele|Atburðarasir):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = true;
        return "keyword";

      // SCENARIO
      } else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景|场景|劇本|剧本|シナリオ|시나리오|เหตการณ์|ಕಥಾಸಾರಾಂಶ|సననివేశం|ਪਟਕਥਾ|परिदृशय|سيناريو|سناریو|תרחיש|Сценаріи|Сценарио|Сценарии|Пример|Σεναριο|Tinh huong|The thing of it is|Tapaus|Szenario|Swa|Stsenaarium|Skenario|Situai|Senaryo|Senario|Scenaro|Scenariusz|Scenariu|Scenario|Scenario|Scenarijus|Scenarijs|Scenarij|Scenarie|Scenar|Scenar|Primer|MISHUN|Kich ban|Keadaan|Heave to|Forgatokonyv|Escenario|Escenari|Cenario|Cenario|Awww, look mate|Atburðaras):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // STEPS
      } else if (!state.inKeywordLine && state.allowSteps && stream.match(/(那麼|那么|而且|當|当|并且|同時|同时|前提|假设|假設|假定|假如|但是|但し|並且|もし|ならは|たたし|しかし|かつ|하지만|조건|먼저|만일|만약|단|그리고|그러면|และ |เมือ |แต |ดังนัน |กำหนดให |ಸಥಿತಿಯನನು |ಮತತು |ನೀಡಿದ |ನಂತರ |ಆದರೆ |మరియు |చెపపబడినది |కాని |ఈ పరిసథితిలో |అపపుడు |ਪਰ |ਤਦ |ਜੇਕਰ |ਜਿਵੇਂ ਕਿ |ਜਦੋਂ |ਅਤੇ |यदि |परनतु |पर |तब |तदा |तथा |जब |चूंकि |किनतु |कदा |और |अगर |و |هنگامی |متى |لكن |عندما |ثم |بفرض |با فرض |اما |اذا |انگاه |כאשר |וגם |בהינתן |אזי |אז |אבל |Якщо |Һәм |Унда |Тоді |Тогда |То |Также |Та |Пусть |Припустимо, що |Припустимо |Онда |Но |Нехаи |Нәтиҗәдә |Лекин |Ләкин |Коли |Когда |Когато |Када |Кад |К тому же |І |И |Задато |Задати |Задате |Если |Допустим |Дано |Дадено |Вә |Ва |Бирок |Әмма |Әитик |Әгәр |Аммо |Али |Але |Агар |А також |А |Τοτε |Οταν |Και |Δεδο&micro;ενου |Αλλα |Þurh |Þegar |Þa þe |Þa |Þa |Zatati |Zakładajac |Zadato |Zadate |Zadano |Zadani |Zadan |Za predpokladu |Za predpokladu |Youse know when youse got |Youse know like when |Yna |Yeah nah |Y'know |Y |Wun |Wtedy |When y'all |When |Wenn |WEN |wann |Ve |Va |Und |Un |ugeholl |Too right |Thurh |Thi |Then y'all |Then |Tha the |Tha |Tetapi |Tapi |Tak |Tada |Tad |Stel |Soit |Siis |Si |Si |Si |Sed |Se |Sa |Quando |Quand |Quan |Pryd |Potom |Pokud |Pokial |Pero |Pero |Pak |Oraz |Onda |Ond |Oletetaan |Og |Och |O zaman |Niin |Nhung |Nar |Nar |Mutta |Men |Mas |Maka |Majd |Majac |Mais |Maar |ma |Ma |Lorsque |Lorsqu'|Logo |Let go and haul |Kun |Kuid |Kui |Kiedy |Khi |Ketika |Kemudian |Ked |Kdyz |Kaj |Kai |Kada |Kad |Jezeli |Jesli |Ja |It's just unbelievable |Ir |I CAN HAZ |I |Ha |Givun |Givet |Given y'all |Given |Gitt |Gegeven |Gegeben seien |Gegeben sei |Gdy |Gangway! |Fakat |Etant donnes |Etant donnes |Etant donnees |Etant donnees |Etant donnee |Etant donnee |Etant donne |Etant donne |Et |Es |Entonces |Enton |Entao |Entao |En |Eger ki |Ef |Eeldades |E |Ðurh |Duota |Dun |Donitajo |Donat |Donada |Do |Diyelim ki |Diberi |Dengan |Den youse gotta |DEN |De |Dato |Dati fiind |Dati fiind |Dati fiind |Dati |Date fiind |Date |Data |Dat fiind |Dar |Dann |dann |Dan |Dados |Dado |Dadas |Dada |Ða ðe |Ða |Cuando |Cho |Cando |Cand |Cand |Cal |But y'all |But at the end of the day I reckon |BUT |But |Buh |Blimey! |Biet |Bet |Bagi |Aye |awer |Avast! |Atunci |Atesa |Ates |Apabila |Anrhegedig a |Angenommen |And y'all |And |AN |An |an |Amikor |Amennyiben |Ama |Als |Alors |Allora |Ali |Aleshores |Ale |Akkor |Ak |Adott |Ac |Aber |A zaroven |A tiez |A taktiez |A take |A |a |7 |\* )/)) {
        state.inStep = true;
        state.allowPlaceholders = true;
        state.allowMultilineArgument = true;
        state.inKeywordLine = true;
        return "keyword";

      // INLINE STRING
      } else if (stream.match(/"[^"]*"?/)) {
        return "string";

      // PLACEHOLDER
      } else if (state.allowPlaceholders && stream.match(/<[^>]*>?/)) {
        return "variable";

      // Fall through
      } else {
        stream.next();
        stream.eatWhile(/[^@"<#]/);
        return null;
      }
    }
  };
});

CodeMirror.defineMIME("text/x-feature", "gherkin");

});

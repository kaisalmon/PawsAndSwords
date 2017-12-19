sass css/cards.scss css/cards.css &
tsc -p tsconfig.json && browserify main/main.js -o js/main.js
alsatian tests/*.spec.js
rm main/*.js.map

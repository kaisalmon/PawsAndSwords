sass css/cards.scss css/cards.css &
tsc -p tsconfig.json && 
browserify main/main.js -o js/main.js &&
browserify main/cardeditor.js -o js/cardeditor.js &&
browserify main/allcards.js -o js/allcards.js &&
alsatian tests/*.spec.js &&
rm main/*.js.map

const { lowerCaseText, longText } = require('i-filter-stuff')

const { green, magenta } = require('i-print-stuff')

const input = [
    "Hello World",
    "hello world",
    "offering the smarter way to continuously translate between strategy and execution.",
    "Offering the Smarter Way To Continuously Translate Between Strategy And Execution."
]

input.filter(lowerCaseText).map(green)
input.filter(longText).map(magenta)

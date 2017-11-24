import colorProvider from 'i-provide-colors'

export const red = text => {
    console.log(colorProvider(text, 'red'))
}

export const magenta = text => {
    console.log(colorProvider(text, 'magenta'))
}

export const green = text => {
    console.log(colorProvider(text, 'green'))
}

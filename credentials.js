const breme = require('./breme.js');

const gCredentials = {'username' : 'john.doe@gmail.com',
                    'password' : 'subreme123.'}

const shipping = {'name' : 'John Doe',
                'email' : 'johndoe@gmail.com',
                'tel' : '123 456 7890',
                'address' : '1 Subreme Boulevard',
                'apt' : '101',
                'zip' : '10101',
                'city' : 'New York',
                'state' : 'NY',
                'country' : 'USA'}

const billing = {'card' : '1234123412341234',
            'expm' : '12',
            'expy' : '2019',
            'cvv' : '123'}

// Create products with arguments (keyword, size, color)
// // size and character are char sensitive (first letter capitalized)
// // If default size/character, input empty string ('') as argument
const items = [ new breme.Product('piping', 'Medium', 'White'),
                    new breme.Product('makah zip up jacket', 'Large', 'Teal')]

module.exports = { gCredentials, shipping, billing, items }
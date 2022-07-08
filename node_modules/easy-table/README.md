# Easy table

Nice utility for rendering text tables with javascript.

## Usage

```javascript
var Table = require('easy-table')

var data = [
  { id: 123123, desc: 'Something awesome', price: 1000.00 },
  { id: 245452, desc: 'Very interesting book', price: 11.45},
  { id: 232323, desc: 'Yet another product', price: 555.55 }
]

var t = new Table

data.forEach(function(product) {
  t.cell('Product Id', product.id)
  t.cell('Description', product.desc)
  t.cell('Price, USD', product.price, Table.number(2))
  t.newRow()
})

console.log(t.toString())
```

The script above will render:

```
Product Id  Description            Price, USD
----------  ---------------------  ----------
123123      Something awesome         1000.00
245452      Very interesting book       11.45
232323      Yet another product        555.55
```

`t.printTransposed()` returns

```
Product Id  : 245452                : 232323              : 123123
Description : Very interesting book : Yet another product : Something awesome
Price, USD  : 11.45                 : 555.55              : 1000.00
```

`t.print()` shows just rows you pushed and nothing more

```
123123  Something awesome      1000.00
245452  Very interesting book    11.45
232323  Yet another product     555.55
```

### How it works

The full signature of `.cell()` is:

```javascript
t.cell(column, value, printer)
```

Rendering occures in two phases. At the first phase `printer`
is called to get the minimal width required to fit the cell content.
At the second phase `printer` is called again with
additional `width` parameter to get actual string to render.

For example, here is how currency printer might be defined

``` javascript
function currency(val, width) {
  var str = val.toFixed(2)
  return width ? Table.padLeft(str, width) : str
}
```

### Table.print()

When you already have an array, explicit table instantiation and iteration
becomes an overhead. For such cases it is convenient to use `Table.print()`.

``` javascript
console.log(Table.print(data))
```

```
id      desc                   price
------  ---------------------  ------
123123  Something awesome      1000
245452  Very interesting book  11.45
232323  Yet another product    555.55
```

It is possible to pass some options

``` javascript
Table.print(data, {
  desc: {name: 'description'}
  price: {printer: Table.number(2)}
})
```

```
id      description            price
------  ---------------------  -------
123123  Something awesome      1000.00
245452  Very interesting book    11.45
232323  Yet another product     555.55
```

or have a full control over rendering

``` javascript
Table.print(data, function(item, cell) {
  cell('Product id', item.id)
  cell('Price, USD', item.price)
}, function(table) {
  return table.print()
})
```

`Table.print()` also accepts objects

``` javascript
Table.print(data[0])
```

```
id    : 123123
desc  : Something awesome
price : 1000
```

### Sorting

You can sort a table by calling `.sort()`, and optionally passing in a list of
column names to sort on (by default uses all columns), or a custom comparator
function. It is also possible to specify the sort order. For example:

``` javascript
t.sort(['Price, USD|des']) // will sort in descending order
t.sort(['Price, USD|asc']) // will sort in ascending order
t.sort(['Price, USD']) // sorts in ascending order by default
```

### Totaling

Easy table can help to calculate and render totals:

``` javascript
t.total('Price, USD')
```

```
Product Id  Description            Price, USD
----------  ---------------------  ----------
245452      Very interesting book       11.45
232323      Yet another product        555.55
123123      Something awesome         1000.00
----------  ---------------------  ----------
                                      1567.00
```

Here is a more elaborate example

```javascript
t.total('Price, USD', {
  printer: Table.aggr.printer('Avg: ', currency),
  reduce: Table.aggr.avg,
  init: 0
})

// or alternatively

t.total('Price, USD', {
  printer: function(val, width) {
    return padLeft('Avg: ' + currency(val), width)
  },
  reduce: function(acc, val, idx, len) {
    acc = acc + val
    return idx + 1 == len ? acc/len : acc
  }
})
```

```
Product Id  Description            Price, USD
----------  ---------------------  -----------
245452      Very interesting book        11.45
232323      Yet another product         555.55
123123      Something awesome          1000.00
----------  ---------------------  -----------
                                   Avg: 522.33
```

## Installation

via npm

```
$ npm install easy-table
```

## License

(The MIT License)

Copyright (c) 2015 Eldar Gabdullin <eldargab@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

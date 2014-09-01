var maxStackSize = 59049;

/*
From Malbolge Specification:
----------------------------
Machine words are ten trits (trinary digits) wide,
giving a maximum possible value of 59048 (all numbers are unsigned).
Memory space is exactly 59049 words long.
*/

var stack = new Array( maxStackSize );

/* 
From Malbolge Specification:
----------------------------
When the interpreter tries to execute a program, it first checks to
see if the current instruction is a graphical ASCII character (33
through 126).  If it is, it subtracts 33 from it, adds C to it, mods it
by 94, then uses the result as an index into the following table of 94
characters: 
*/

var xlat1 = "+b(29e*j1VMEKLyC})8&m#~W>qxdRp0wkrUo[D7,XTcA\"lI.v%{gJh4G\\-=O@5`_3i<?Z';FNQuY]szf$!BS/|t:Pn6^Ha";

/*
From Malbolge Specification: 
----------------------------
After the instruction is executed, 33 is subtracted from the instruction
at C, and the result is used as an index in the table below.  The new
character is then placed at C, and then C is incremented.
*/
var xlat2 = "5z]&gqtyfr$(we4{WP)H-Zn,[%\\3dL+Q;>U!pJS72FhOA1CB6v^=I_0/8|jsb9m<.TVac`uY*MK'X~xDl}REokN:#?G\"i@";

//Node modules
var program = require( 'commander' );
var fs = require( 'fs' );

/*
Parse command-line options
*/
program.version( '0.0.1 ')
    .option( '-s, --source [source]', 'source file' )
    .parse( process.argv );

/*
Check for proper command line arguments
exactly as in original implementation
*/
if ( !program.source ) {
    console.error( 'invalid command line\n' );
    process.exit( 1 );
}

/*
Open source file and read it's contents
*/
var data = fs.readFileSync( program.source, {
    encoding: 'utf8', //read file as a string instead of buffer
    flag: 'r'         //open file as read-only
} );

/*
Equivalent to file content check on lines 57-61 in the 
original C implementation
*/
if ( !data ) {
    console.error( 'can\'t open file\n' );
    process.exit( 1 );
}

/*
This is an integer variable that corresponds to the 'j' 
variable declared on line 49 of the original C implementation
*/
var j;

/*
This is an integer index variable equivalent to the 'i' 
variable declared on line 49 of the original C implementation
*/
var index = 0;

while (index < data.length - 2) {
    /* 
    Variable 'currentChar' is equivalent to the integer variable 
    'x' declared on line 50 of the original C implementation.
    */
    var currentChar = data[ index ],
        asciiChar = currentChar.charCodeAt( 0 );
    if ( /\s/.test( currentChar) ) continue;
    if ( asciiChar < 127 && asciiChar > 32 ) {
        var xlat1Index = xlat1[ ( ( asciiChar - 33 ) + index ) % 94 ];
        if ( 'ji*p</vo'.indexOf( xlat1Index ) === -1 ) {
            console.error( 'invalid character in source file\n' );
            process.exit( 1 );
        }
    }
    if ( index === maxStackSize ) {
        console.error( 'input file too long\n' );
        process.exit( 1 );
    }
    stack[ index++ ] = asciiChar;
}
while ( index < maxStackSize ) {
    stack[ index ] = op( stack[ index - 1 ], stack[ index - 2 ] );
    index++;
}
exec( stack );
process.exit( 0 );

/*
'exec' function corresponds to function declaration in lines 102-137
in original C implementation.

From the Malbolge Specification:
--------------------------------
j
    sets the data pointer to the value in the cell pointed to by the
    current data pointer.

i
    sets the code pointer to the value in the cell pointed to be the
    current data pointer.

*
    rotates the trinary value of the cell pointed to by D to the right 1.
    The least significant trit becomes the most significant trit, and all
    others move one position to the left.

p
    performs a tritwise "op" on the value pointed to by D with the
    contents of A.  The op (don't look for pattern, it's not there) is:
            | A trit:
    ________|_0__1__2_
          0 | 1  0  0
       D  1 | 1  0  2
     trit 2 | 2  2  1
*/
function exec( stack ) {
    /* 
    Register declarations
    From Malbolge Specification:
    ----------------------------
    The three registers are A, C, and D.  A is the accumulator, used for
    data manipulation.  A is implicitly set to the value written by all
    write operations on memory.  (Standard I/O, a distinctly non-chip-level
    feature, is done directly with the A register.)

    C is the code pointer.  It is automatically incremented after each
    instruction, and points the instruction being executed.

    D is the data pointer.  It, too, is automatically incremented after each
    instruction, but the location it points to is used for the data
    manipulation commands.

    All registers begin with the value 0.
    */
    var a = 0, c = 0, d = 0;
    /*
    Integer variable declaration from line 108 of original C implementation
    */
    var x;
    while(true) {
        if ( stack[ c ] < 33 || stack[ c ] > 126 ) continue;
        switch ( xlat1[ ( ( stack[ c ] - 33 ) + c ) % 94 ] ) {
            case 'j': 
                d = stack[ d ]; 
                break;
            case 'i': 
                c = stack[ d ];
                break;
            case '*':
                a = stack[ d ] = Math.floor( stack[ d ] / 3 ) + stack[ d ] % 3 * 19683;
                break;
            case 'p': 
                a = stack[ d ] = op( a, stack[ d ] );
                break;
            case '<':
                console.log(a);
                break;
            case '/':
                a = process.stdin.readline();
                break;
            case 'v':
                return;
        }
        stack[ c ] = xlat2[ stack[ c ] - 33 ];
        if ( c === maxStackSize ) c = 0;
        else c++;
        
        if ( d === maxStackSize ) d = 0;
        else d++;
    }
}
/*
'op' function corresponds to function declaration in lines 139-162 
in original C implementation.

From Malbolge Specification:
----------------------------
Di-trits:
    00 01 02 10 11 12 20 21 22

00  04 03 03 01 00 00 01 00 00
01  04 03 05 01 00 02 01 00 02
02  05 05 04 02 02 01 02 02 01
10  04 03 03 01 00 00 07 06 06
11  04 03 05 01 00 02 07 06 08
12  05 05 04 02 02 01 08 08 07
20  07 06 06 07 06 06 04 03 03
21  07 06 08 07 06 08 04 03 05
22  08 08 07 08 08 07 05 05 04
*/
function op( x, y ) {
    /*
    Variable declarations from line 144 in the original C implementation
    */
    var i = 0;
    /*
    Variable declaration from line 145-146 in the original C implementation
    */
    var p9 = [ 1, 9, 81, 729, 6561 ];
    /*
    Variable declaration from line 147-158 in the original C implemenation
    */
    var o = [
        [ 4, 3, 3, 1, 0, 0, 1, 0, 0 ],
        [ 4, 3, 5, 1, 0, 2, 1, 0, 2 ],
        [ 5, 5, 4, 2, 2, 1, 2, 2, 1 ],
        [ 4, 3, 3, 1, 0, 0, 7, 6, 6 ],
        [ 4, 3, 5, 1, 0, 2, 7, 6, 8 ],
        [ 5, 5, 4, 2, 2, 1, 8, 8, 7 ],
        [ 7, 6, 6, 7, 6, 6, 4, 3, 3 ],
        [ 7, 6, 8, 7, 6, 8, 4, 3, 5 ],
        [ 8, 8, 7, 8, 8, 7, 5, 5, 4 ]
    ];

    for (j = 0; j < p9.length; j++ ) {
        var p9j = p9[j];
        //values need to be either rounded or floored.  trying rounded first.
        var yVal = Math.floor(y / p9j);
        var xVal = Math.floor(x / p9j);
        i += o[ yVal % o.length ][ xVal % o.length  ] * p9j;
    }
    return i;
}

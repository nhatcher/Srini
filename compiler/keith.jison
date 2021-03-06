
/* 
Grammar for the Keith Programming Language (KPL)
================================================

A language for mathematical expressions

*/

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
(?:[0-9]|[1-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b return 'NUMBER'
"Plot"                return 'PLOT'
"Print"               return 'PRINT'
"true"|"false"        return 'BOOLEAN'
[a-zA-Z][a-zA-Z0-9]*  return 'NAME'
\"[a-zA-Z#_\-0-9]+\"  return 'STRING'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"!"                   return '!'
"("                   return '('
")"                   return ')'
"["                   return '['
"]"                   return ']'
"{"                   return '{'
"}"                   return '}'
","                   return ','
":"                   return ':'
"="                   return '='
";"                   return ';'
[\']+                 return 'DERIVATES'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%left UMINUS

%start program

%% /* language grammar */

program
    : statements EOF
        {return $1;}
    ;

statements
    : statement
        { $$ = [$1];}
    | statements statement
        { $$ = $1.concat($2);}
    ;

statement
    : function_declaration
        { $$ = $1;}
    | plot_command
        { $$ = $1;}
    | print_statement
        { $$ = $1;}
    ;

function_declaration
    : NAME '(' NAME ')' '=' expr ';'
        {$$ = {type: 'function_declaration', name: $1, variable: $3, expression: $6};}
    ;

value
    : atomic_value
        {$$ = $1;}
    | array
        {$$ = $1;}
    ;

atomic_value
    : number
        {$$ = $1;}
    | STRING
        {$$ = $1.slice(1, -1);}
    | BOOLEAN
        {$$ = $1 === 'true';}
    ;

number
    : NUMBER
        {$$ = Number($1);}
    | '-' NUMBER
        {$$ = -$2;}
    ;

array
    : '[' arrayList ']'
        {$$ = $2;}
    ;

arrayList
    : atomic_value
        { $$ = [$1];}
    | arrayList ',' atomic_value
        { $1.push($3); $$ = $1;}
    ;

plot_command
    : PLOT '(' plot_functions ',' option_list ')' ';'
        { $$ = {type:"plot_command", list:$3, options: $5};}
    | PLOT '(' plot_functions ',' '[' number ',' number ']'  ')' ';'
        { $$ = {type:"plot_command", list:$3, options: [{key:'xrange', value:[$6, $8]}]};}
    ;

plot_functions
    : function_list_member
        {$$ = [$1];}
    | '[' function_list ']'
        {$$ = $2;}
    ;

option_list
    : option_list_member
        { $$ = [$1];}
    | option_list ',' option_list_member
        { $1.push($3); $$ = $1;}
    ;

option_list_member
    : NAME '=' value
        {$$ = {key:$1, value:$3};}
    ;

function_list
    : function_list_member
        {$$ = [$1];}
    | function_list ',' function_list_member
        { $1.push($3); $$ =$1; }
    ;

function_list_member
    : NAME 
        {$$ = {value:$1, options: {}};}
    | '{' NAME ',' option_list '}'
        {$$ = {value: $2, options: $4};}
    ;

print_statement
    : PRINT '(' expr ')' ';'
        {$$ = {type: 'print_statement', expr: $3};}
    ;


expr
    : expr '+' expr
        {$$ = {type:'op', value: '+', children: [$1, $3]};}
    | expr '-' expr
        {$$ = {type:'op', value: '-', children: [$1, $3]};}
    | expr '*' expr
        {$$ = {type:'op', value: '*', children: [$1, $3]};}
    | expr '/' expr
        {$$ = {type:'op', value: '/', children: [$1, $3]};}
    | expr '^' expr
        {$$ = {type:'function', value: 'pow', children: [$1, $3]};}
    | expr '!'
        {$$ = {type:'function', value:'gamma', children: [$1]};}
    | '-' expr %prec UMINUS
        {{
            if($2.type === 'unary') {
                throw new Error('Inavlid double unary');
            } else {
                $$ = {type:'unary', value: '-', children: [$2]};
            }
        }}
    | '+' expr %prec UMINUS
        {$$ = $2;}
    | '(' expr ')'
        {$$ = $2;}
    | NUMBER
        {$$ = {type:'number', value:Number($1)};}
    | NAME
        {$$ = {type:'variable', value:$1};}
    | NAME '(' expr_list ')'
        {$$ = {type:'function', value:$1, children:$3};}
    | NAME DERIVATES '(' expr ')'
        {$$ = {type:'derivation', value:$1, order:$2.length, children:[$4]};}
    ;

expr_list
    : expr
        {$$ = [$1];}
    | expr_list ',' expr
        { $1.push($3); $$ = $1; }
    ;


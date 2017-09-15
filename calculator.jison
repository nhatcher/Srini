
/* description: Parses mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
\-?(?:[0-9]|[1-9][0-9]+)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?\b return 'NUMBER'
"plot"                return 'PLOT'
"true"|"false"        return 'BOOLEAN'
[a-zA-Z]+             return 'NAME'
\"[a-zA-Z]+\"         return 'STRING'
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
    : NUMBER
        {$$ = Number($1);}
    | STRING
        {$$ = $1;}
    | BOOLEAN
        {$$ = $1 === 'true';}
    ;

array
    : '[' arrayList ']'
        {$$ = $2;}
    ;

arrayList
    : atomic_value
        { $$ = [$1];}
    | atomic_value ',' arrayList
        { $$ = $3.push($1);}
    ;

plot_command
    : PLOT '(' plot_functions ',' option_list ')' ';'
        { $$ = {type:"plot", fun: $3, options: $5};}
    ;

plot_functions
    : function_list_member
        {$$ = {type: 'function_list', list:[$1]};}
    | '[' function_list ']'
        {$$ = {type: 'function_list', list:$1};}
    ;

option_list
    : option_list_member
        { $$ = [$1];}
    | option_list ',' option_list_member
        { $$ = $1.push($3);}
    ;

option_list_member
    : NAME '=' value
        {$$ = {type:"option", key:$1, value:$3};}
    ;

function_list
    : function_list_member
        {$$ = [$1];}
    | function_list ',' function_list_member
        { $$ = $1.push($3);}
    ;

function_list_member
    : NAME 
        {$1 = {value:$1, options: {}};}
    | '{' NAME ',' option_list '}'
        {$1 = {value: $2, options: $4};}
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
        {$$ = {type:'op', value: '^', children: [$1, $3]};}
    | expr '!'
        {{
          $$ = {type:'function', value:'fact', children:$1};
        }}
    | '-' expr %prec UMINUS
        {$$ = {type:'unary', value: '-', children: $2};}
    | '(' expr ')'
        {$$ = $2;}
    | NUMBER
        {$$ = {type:'number', value:Number($1)};}
    | NAME
        {$$ = {type:'var', value:$1};}
    | NAME '(' expr ')'
        {$$ = {type:'function', value:$1, children:$3};}
    ;




/* description: Parses mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
([\-\+])?[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"plot"                return 'PLOT'
"true"|"false"        return 'BOOL'
[a-zA-Z]+             return 'CONST'
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
    : var_declaration
        { $$ = $1;}
    | function_declaration
        { $$ = $1;}
    | plot
        { $$ = $1;}
    ;

var_declaration
    : CONST '=' JSONObject
        {$$ = {type: 'var', name:$1, value: $3};}
    ;

function_declaration
    : CONST '(' CONST ')' '=' e
        {$$ = {type: 'function_declaration', name: $1, variable: $3, expression: $6};}
    ;

plot
    : PLOT '[' e ',' '{' CONST ',' NUMBER ',' NUMBER '}' ']'
        {$$ = {type: 'plot', expression: $3, variable: $6, xmin:Number($8), xmax: Number($10)};}
    ;

JSONObject
    : '{' JSONMemberList '}'
        {$$ = {type: 'json' value:$1};}
    ;
JSONMemberList
    : JSONMember
        {$$ = {$1[0]: $1[1]};}
    | JSONMemberList JSONMember
        {$$ = $1[$2[0]] = $2[1];}
    ;

JSONMember
    : JSONString ":" JSONValue
        { $$ = [$1, $3];}
    ;
JSONString
    : CONST
        { $$ = yyetx;}
    ;

JSONNumber
    : NUMBER
        {$$ = Number($1);}
    ;

JSONValue
    : BOOL
        {$$ = $1 === 'true';}
    | JSONString
        {$$ = $1;}
    | JSONNumber
        {$$ = $1;}
    | JSONObject
        {$$ = $1;}
    | JSONArray
        {$$ = $1;}
    ;

JSONArray
    : "[" JSONElementList "]"
         { $$ = $2; }
    ;

JSONElementList
    : JSONValue
        { $$ = [$1];}
    | JSONElementList "," JSONValue
        { $$ = $1.push($3);}
    ;


e
    : e '+' e
        {$$ = {type:'op', value: '+', children: [$1, $3]};}
    | e '-' e
        {$$ = {type:'op', value: '-', children: [$1, $3]};}
    | e '*' e
        {$$ = {type:'op', value: '*', children: [$1, $3]};}
    | e '/' e
        {$$ = {type:'op', value: '/', children: [$1, $3]};}
    | e '^' e
        {$$ = {type:'op', value: '^', children: [$1, $3]};}
    | e '!'
        {{
          $$ = {type:'function', value:'fact', children:$1};
        }}
    | '-' e %prec UMINUS
        {$$ = {type:'unary', value: '-', children: $2};}
    | '(' e ')'
        {$$ = $2;}
    | NUMBER
        {$$ = {type:'number', value:Number($1)};}
    | CONST
        {$$ = {type:'var', value:$1};}
    | CONST '(' e ')'
        {$$ = {type:'function', value:$1, children:$3};}
    ;




/* description: Parses mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
([\-\+])?[0-9]+("."[0-9]+)?\b  return 'NUMBER'
"plot"                return 'PLOT'
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
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%left UMINUS

%start statements

%% /* language grammar */

statements
    : plot EOF
        {
            return $1;
        }
    ;

plot
    : PLOT '[' e ',' '{' CONST ',' NUMBER ',' NUMBER '}' ']'
        {$$ = {type: 'plot', expression: $3, variable: $6, xmin:Number($8), xmax: Number($10)};}
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



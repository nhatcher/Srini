
/* description: Parses mathematical expressions. */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+("."[0-9]+)?\b  return 'NUMBER'
[a-zA-Z]+             return 'CONST'
"*"                   return '*'
"/"                   return '/'
"-"                   return '-'
"+"                   return '+'
"^"                   return '^'
"!"                   return '!'
"("                   return '('
")"                   return ')'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%left '+' '-'
%left '*' '/'
%left '^'
%right '!'
%left UMINUS

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { 
           /* console.log(JSON.stringify($1, null, '  '));*/
           return $1;
        }
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
        {$$ = {type:'number', value:$1};}
    | CONST
        {$$ = {type:'var', value:$1};}
    | CONST '(' e ')'
        {$$ = {type:'function', value:$1, children:$3};}
    ;



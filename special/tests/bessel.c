
// gcc -o bessel bessel.c -lm -lflint -larb

#include "arb.h"
#include "arb_hypgeom.h"

int main()
{
    arb_t x, y, n;
    arb_init(x);
    arb_init(y);
    arb_init(n);
    slong prec = 150;
    arb_set_str(x, "3.456", prec);
    arb_set_str(n, "4", prec);
    arb_hypgeom_bessel_j(y, n, x, prec);
    arb_printn(y, 50, 0);
    flint_printf("\n");
    flint_printf("Computed with arb-%s\n", arb_version);
    arb_clear(x);
    arb_clear(n);
    arb_clear(y);
}

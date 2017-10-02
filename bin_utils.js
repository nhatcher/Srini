const bin_utils = (function(){
    /**
    * float64 (64 bits)
    * f := fraction (significand/mantissa) (52 bits)
    * e := exponent (11 bits)
    * s := sign bit (1 bit)
    *
    * |-------- -------- -------- -------- -------- -------- -------- --------|
    * |                                Float64                                |
    * |-------- -------- -------- -------- -------- -------- -------- --------|
    * |              Uint32               |               Uint32              |
    * |-------- -------- -------- -------- -------- -------- -------- --------|
    *
    * If little endian (more significant bits last):
    *                         <-- lower      deepEqualer -->
    * |   f7       f6       f5       f4       f3       f2    e2 | f1 |s|  e1  |
    *
    * If big endian (more significant bits first):
    *                         <-- deepEqualer      lower -->
    * |s| e1    e2 | f1     f2       f3       f4       f5        f6      f7   |
    *
    *
    * Note: in which Uint32 can we find the lower order bits? If LE, the first; if BE, the second.
    * Refs: http://pubs.opengroup.org/onlinepubs/9629399/chap14.htm
    */

    var FLOAT64_VIEW = new Float64Array(1);
    var INT32_VIEW = new Int32Array(FLOAT64_VIEW.buffer);

    // IS LITTLE ENDIAN //

    function isLittleEndian() {
        var uint16_view;
        var uint8_view;

        uint16_view = new Uint16Array(1);

        // Set the uint16 view to a value having distinguishable lower and higher order words.
        // 4660 => 0x1234 => 0x12 0x34 => '00010010 00110100' => (0x12,0x34) == (18,52)
        uint16_view[0] = 0x1234;

        // Create a uint8 view on top of the uint16 buffer:
        uint8_view = new Uint8Array( uint16_view.buffer );

        // If little endian, the least significant byte will be first...
        return ( uint8_view[0] === 0x34 );
    }

    let LOW, HIGH;
    if (isLittleEndian() === true) {
        LOW = 0; // first index
        HIGH = 1;
    } else {
        LOW = 1; // second index
        HIGH = 0;
    }

    function setLowWord(x, low) {
        FLOAT64_VIEW[0] = x;
        INT32_VIEW[LOW] = ( low >>> 0 ); // identity bit shift to ensure integer
        return FLOAT64_VIEW[0];
    }

    function lowWord(x) {
        FLOAT64_VIEW[0] = x;
        return INT32_VIEW[LOW];
    }

    function highWord(x) {
        FLOAT64_VIEW[0] = x;
        return INT32_VIEW[HIGH];
    }

    return {
        highWord: highWord,
        lowWord: lowWord,
        isLittleEndian: isLittleEndian,
        setLowWord: setLowWord
    }
})()
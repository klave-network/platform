const MINUS_CODE: u16 = 0x2d; // '-'

const HEX_CODES = memory.data<u8>([
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
    0x38, 0x39, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66
]);

function byteToHex(byte: u32): u32 {
    return (
        <u32>load<u8>(HEX_CODES + (byte >> 4 & 0x0F)) |
        <u32>load<u8>(HEX_CODES + (byte >> 0 & 0x0F)) << 16
    );
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
export default function uuid(arr: Uint8Array, offset: i32 = 0): string {
    const src = arr.dataStart + offset;
    const dst = __new(16 * 4 + 4 * 2, idof<string>());

    store<u32>(dst + 0, byteToHex(load<u8>(src + 0)));
    store<u32>(dst + 4, byteToHex(load<u8>(src + 1)));
    store<u32>(dst + 8, byteToHex(load<u8>(src + 2)));
    store<u32>(dst + 12, byteToHex(load<u8>(src + 3)));

    store<u16>(dst + 16, MINUS_CODE);

    store<u32>(dst + 18, byteToHex(load<u8>(src + 4)));
    store<u32>(dst + 22, byteToHex(load<u8>(src + 5)));

    store<u16>(dst + 26, MINUS_CODE);

    store<u32>(dst + 28, byteToHex(load<u8>(src + 6)));
    store<u32>(dst + 32, byteToHex(load<u8>(src + 7)));

    store<u16>(dst + 36, MINUS_CODE);

    store<u32>(dst + 38, byteToHex(load<u8>(src + 8)));
    store<u32>(dst + 42, byteToHex(load<u8>(src + 9)));

    store<u16>(dst + 46, MINUS_CODE);

    store<u32>(dst + 48, byteToHex(load<u8>(src + 10)));
    store<u32>(dst + 52, byteToHex(load<u8>(src + 11)));
    store<u32>(dst + 56, byteToHex(load<u8>(src + 12)));
    store<u32>(dst + 60, byteToHex(load<u8>(src + 13)));
    store<u32>(dst + 64, byteToHex(load<u8>(src + 14)));
    store<u32>(dst + 68, byteToHex(load<u8>(src + 15)));

    return changetype<string>(dst);
}

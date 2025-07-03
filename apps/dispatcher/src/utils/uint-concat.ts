export const concatUint8Arrays = (arrays: Uint8Array[]) => {

    const totalLength = arrays.reduce((acc, value) => acc + value.length, 0);

    if (!arrays.length)
        return null;

    const result = new Uint8Array(totalLength);

    let length = 0;
    for (const array of arrays) {
        result.set(array, length);
        length += array.length;
    }

    return result;
};
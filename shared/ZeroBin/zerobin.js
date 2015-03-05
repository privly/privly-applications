/**
 * ZeroBin Privly Fork
 *
 * This is a port of the ZeroBin project for a Privly injectable appliction.
 *
 * @link http://sebsauvage.net/wiki/doku.php?id=php:zerobin
 * @author sebsauvage
 * @contributor smcgregor
 *
 *
 * Copyright (c) 2012 Sébastien SAUVAGE (sebsauvage.net)
 * This software is provided 'as-is', without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose, including commercial applications, and to alter it and redistribute it freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must 
 *    not claim that you wrote the original software. If you use this 
 *      software in a product, an acknowledgment in the product documentation
 *      would be appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must 
 *    not be misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source distribution.
 *
 */

// Immediately start random number generator collector.
sjcl.random.startCollectors();

/**
 * Compress a message (deflate compression).
 *
 * @param {string} message
 * @return {string} base64 encoded data.
 */
function compress(message) {
    return Base64.toBase64( RawDeflate.deflate( Base64.utob(message) ) );
}

/**
 * Decompress a message compressed with compress().
 *
 * @param {string} data Base64 encoded data.
 *
 * @return {string} Decompressed data.
 */
function decompress(data) {
    return Base64.btou( RawDeflate.inflate( Base64.fromBase64(data) ) );
}

/**
 * Compress, then encrypt message with key.
 *
 * @param string key
 * @param string message
 * @return encrypted string data
 */
function zeroCipher(key, message) {
    return sjcl.encrypt(key,compress(message));
}
/**
 *  Decrypt message with key, then decompress.
 *
 *  @param {string} key
 *  @param {json} data a JSON document storing the content and
 *  initialization vector.
 *  @return {string} readable message
 */
function zeroDecipher(key, data) {
    
    // Patch for old versions of sjcl
    if( typeof data !== "string" ) {
      data = JSON.stringify(data);
    }
    
    return decompress(sjcl.decrypt(key,data));
}

/**
 * Return the deciphering key stored in anchor part of the URL.
 *
 * @param {string} key The key parameter stored on the anchor text.
 *
 * @return {string} Gives the decryption key found in the URL
 *
 */
function pageKey(key) {        
    // Some stupid web 2.0 services and redirectors add data AFTER the anchor
    // (such as &utm_source=...).
    // We will strip any additional data.
    
    // First, strip everything after the equal sign (=) which signals end of base64 string.
    i = key.indexOf('='); if (i>-1) { key = key.substring(0,i+1); }
    
    // If the equal sign was not present, some parameters may remain:
    i = key.indexOf('&'); if (i>-1) { key = key.substring(0,i); }
    
    // Then add trailing equal sign if it's missing
    if (key.charAt(key.length-1)!=='=') key+='=';
    
    return key;
}

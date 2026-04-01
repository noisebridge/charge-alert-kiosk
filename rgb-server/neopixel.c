/**
 * WS2812 LED driver via SPI (/dev/spidev0.0).
 * Works on Raspberry Pi 5 (no rpi_ws281x dependency).
 *
 * SPI at 6.4 MHz: each SPI bit ≈ 156ns.
 * Each WS2812 bit is encoded as 8 SPI bits (1 byte, ~1.25µs):
 *   WS2812 "0" → 0b11000000 (0xC0)  T0H≈312ns, T0L≈938ns
 *   WS2812 "1" → 0b11110000 (0xF0)  T1H≈625ns, T1L≈625ns
 *
 * One WS2812 bit per SPI byte — no bit ever straddles a byte boundary.
 *
 * Compile on the Pi:
 *   gcc -shared -o libneopixel.so -fPIC neopixel.c
 */
#include <fcntl.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <sys/ioctl.h>
#include <linux/spi/spidev.h>

static int spi_fd = -1;
static int initialized = 0;
static int led_count = 0;
static int led_brightness = 255;
static uint32_t *pixels = NULL;
static uint8_t *spi_buf = NULL;
static int spi_buf_len = 0;

#define SPI_SPEED   6400000
#define RESET_BYTES 64  /* ~80µs of low at 6.4 MHz */

/* Encode one color byte (8 WS2812 bits) into 8 SPI bytes.
 * Each WS2812 bit = one SPI byte: "0" → 0xC0, "1" → 0xF8 */
static void encode_byte(uint8_t byte, uint8_t *out) {
    for (int i = 7; i >= 0; i--) {
        out[7 - i] = (byte & (1 << i)) ? 0xF8 : 0xC0;
    }
}

int neopixel_init(int num_leds, int brightness) {
    spi_fd = open("/dev/spidev0.0", O_WRONLY);
    if (spi_fd < 0) return -1;

    uint8_t mode = SPI_MODE_0;
    uint8_t bits = 8;
    uint32_t speed = SPI_SPEED;

    if (ioctl(spi_fd, SPI_IOC_WR_MODE, &mode) < 0) goto fail;
    if (ioctl(spi_fd, SPI_IOC_WR_BITS_PER_WORD, &bits) < 0) goto fail;
    if (ioctl(spi_fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed) < 0) goto fail;

    led_count = num_leds;
    led_brightness = brightness;
    pixels = (uint32_t *)calloc(num_leds, sizeof(uint32_t));
    /* reset + 24 SPI bytes per LED (3 color bytes × 8 SPI bytes) + reset */
    spi_buf_len = RESET_BYTES + num_leds * 24 + RESET_BYTES;
    spi_buf = (uint8_t *)calloc(spi_buf_len, 1);

    if (!pixels || !spi_buf) goto fail;

    initialized = 1;
    return 0;

fail:
    if (spi_fd >= 0) { close(spi_fd); spi_fd = -1; }
    free(pixels); pixels = NULL;
    free(spi_buf); spi_buf = NULL;
    return -1;
}

int neopixel_num_leds(void) {
    return initialized ? led_count : 0;
}

void neopixel_set_pixel(int index, unsigned int color) {
    if (!initialized || index < 0 || index >= led_count) return;
    pixels[index] = color;
}

void neopixel_fill(unsigned int color) {
    if (!initialized) return;
    for (int i = 0; i < led_count; i++)
        pixels[i] = color;
}

void neopixel_set_brightness(int brightness) {
    if (!initialized) return;
    led_brightness = brightness;
}

int neopixel_render(void) {
    if (!initialized) return -1;

    /* Leading reset (zeros from calloc/previous render) */
    memset(spi_buf, 0, RESET_BYTES);
    uint8_t *p = spi_buf + RESET_BYTES;
    for (int i = 0; i < led_count; i++) {
        uint32_t c = pixels[i];
        uint8_t r = (c >> 16) & 0xFF;
        uint8_t g = (c >> 8) & 0xFF;
        uint8_t b = c & 0xFF;

        /* Apply brightness scaling */
        r = (uint8_t)((r * led_brightness) >> 8);
        g = (uint8_t)((g * led_brightness) >> 8);
        b = (uint8_t)((b * led_brightness) >> 8);

        /* WS2812 expects GRB order */
        encode_byte(g, p); p += 8;
        encode_byte(r, p); p += 8;
        encode_byte(b, p); p += 8;
    }
    /* Trailing reset */
    memset(p, 0, RESET_BYTES);

    int written = write(spi_fd, spi_buf, spi_buf_len);
    return (written == spi_buf_len) ? 0 : -1;
}

void neopixel_cleanup(void) {
    if (initialized) {
        /* Turn off all LEDs */
        for (int i = 0; i < led_count; i++)
            pixels[i] = 0;
        neopixel_render();

        close(spi_fd);
        spi_fd = -1;
        free(pixels); pixels = NULL;
        free(spi_buf); spi_buf = NULL;
        initialized = 0;
    }
}

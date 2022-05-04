from IT8951 import constants
from IT8951.display import AutoEPDDisplay
from PIL import Image #, ExifTags
from math import floor
import time
import watchdog.events
import watchdog.observers
from pathlib import Path
import os
import signal
import sys

# 1448 / 1072 = ~1.35
RATIO_DISPLAY = 1.35
DIMS = (1448, 1072)
IMG_LISTEN_DIR = os.path.dirname(__file__) + '/img'

display = None
observer = None

def init_display():
    print('Initializing display')
    display = AutoEPDDisplay(vcom=-2.22)

    print('Clearing display')
    display.clear()

    return display


def show_image(display: AutoEPDDisplay, path: str):
    print(' Img: ' + path)

    if not os.path.isfile(path):
        return

    image = Image.open(path)

    print(' Orig image width: ' + str(image.width) + ' height: ' + str(image.height))

    # exif = image._getexif()
    # if orientation_key in exif:
    #     orientation = exif[orientation_key]
    #     if orientation == 6:
    #         print(' Rotating..')
    #         image = image.rotate(-90, expand=True)

    # Determine if the image is wide or tall
    ratio = image.width / image.height
    if ratio > RATIO_DISPLAY:
        print(' It\'s wide')
        # Wide - keep its height
        new_width = floor(image.height * RATIO_DISPLAY)
        new_width_border = floor((image.width / 2) - (new_width / 2))
        crop_dims = (new_width_border, 0, image.width - new_width_border, image.height)
        print(' Crop dims: ' + str(crop_dims))
        image = image.crop(crop_dims)
    elif ratio < RATIO_DISPLAY:
        print(' It\'s tall')
        # Tall - keep its width
        new_height = floor(image.width / RATIO_DISPLAY)
        new_height_border = floor((image.height / 2) - (new_height / 2))
        crop_dims = (0, new_height_border, image.width, image.height - new_height_border)
        print(' Crop dims: ' + str(crop_dims))
        image = image.crop(crop_dims)

    print(' Cropped image width: ' + str(image.width) + ' height: ' + str(image.height))
    image.thumbnail(DIMS)
    print('  Thumbnail image width: ' + str(image.width) + ' height: ' + str(image.height))

    paste_coords = [DIMS[i] - image.size[i] for i in (0,1)]  # Align image with bottom of display

    display.clear()
    display.frame_buf.paste(0xFF, box=(0, 0, display.width, display.height))
    display.frame_buf.paste(image, paste_coords)
    display.draw_full(constants.DisplayModes.GC16)


class Handler(watchdog.events.PatternMatchingEventHandler):
    def __init__(self, display):
        self.display = display
        watchdog.events.PatternMatchingEventHandler.__init__(self,
            patterns=['*'],
            ignore_directories=True, case_sensitive=False)

    def on_created(self, event):
        print(self.display)
        print(event)
        p = Path(event.src_path)
        show_image(self.display, str(p.resolve(event.src_path)))
        os.remove(event.src_path)


def shutdown(signum, frame):
    display.clear()
    observer.stop()
    observer.join()
    sys.exit(0)

if __name__ == '__main__':
    display = init_display()

    print('listener path: ' + IMG_LISTEN_DIR)

    event_handler = Handler(display)
    observer = watchdog.observers.Observer()
    observer.schedule(event_handler, path=IMG_LISTEN_DIR, recursive=False)
    observer.start()

    signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(0.5)
    except KeyboardInterrupt:
        display.clear()
        observer.stop()
    observer.join()


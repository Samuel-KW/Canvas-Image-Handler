function ImageObject (src, x, y, width, height) {

    this.src = src;

    this.x = x;
    this.y = y;

    this.width = width;
    this.height = height;

    this.contains = function (x, y) {
        return this.x <= x && x <= this.x + this.width &&
               this.y <= y && y <= this.y + this.height;
    };

    this.draw = function (ctx) {
        ctx.drawImage(this.src, this.x, this.y, this.width, this.height);
    };
}

class CanvasHandler {

    constructor(parent, aspectX, aspectY) {

        this.parent = parent;
        this.aspect = { x: aspectX, y: aspectY };

        this.c = document.createElement('canvas');
        this.ctx = this.c.getContext('2d');

        this.listeners = {
            move: [],
            down: [],
            up: []
        };

        this.objects = [];

        parent.appendChild(this.c);

        this.setup_listeners();
    }

    setup_listeners() {

        const events = [ 'move', 'down', 'up' ];

        for (const type of events) {

            window.addEventListener('mouse' + type, event => {

                let objects = [];

                for (const object of this.objects) {

                    if (object.contains(event.x, event.y))
                        objects.push(object);
                }

                this.listeners[type].forEach(fn => fn(objects, event));
            });
        }

        window.addEventListener('resize', () => this.handle_resize());

        document.addEventListener('paste', e => this.handle_paste(e));

        document.addEventListener('dragover', e => e.preventDefault());

        document.addEventListener('drop', e => this.handle_drop(e));

        this.handle_resize();

    }

    addEventListener (type, listener) {
        switch (type) {
            case 'move':
            case 'mousemove': this.listeners.move.push(listener); break;
            case 'mousedown': this.listeners.down.push(listener); break;
            case 'mouseup': this.listeners.up.push(listener); break;
        }
    }

    handle_paste(e) {

        if (e.clipboardData) {

            e.preventDefault();

            const items = e.clipboardData.items;
            if (!items) return;

            this.handle_files(items);
            
        }
    }

    handle_drop(e) {

        e.preventDefault();

        const items = e.dataTransfer.items;
        if (!items) return;

        this.handle_files(items);
    }

    handle_files(items) {

        for (let i = 0; i < items.length; ++i) {

            if (items[i].type.includes('image')) {

                const blob = items[i].getAsFile();
                const url = window.URL || window.webkitURL;
                const source = url.createObjectURL(blob);

                this.create_image(source);
            }
        }
    }

    handle_resize() {

        const rect = this.parent.getBoundingClientRect();

        this.c.width = rect.width;
        this.c.height = (rect.width * this.aspect.y) / this.aspect.x;

        this.draw();
    }

    create_image(source) {

        const image = new Image();
        const object = new ImageObject(image, 0, 0, 0, 0);

        image.onload = () => {
            
            object.width = image.width;
            object.height = image.height;

            this.draw();
        };

        image.src = source;
        this.objects.push(object);

        return image;
    }

    draw() {
        const ctx = this.ctx;
        const c = this.c;

        ctx.clearRect(0, 0, c.width, c.height);

        for (let i = 0; i < this.objects.length; ++i) {
            const obj = this.objects[i];
            obj.draw(ctx);
        }
    }

    to_b64() {
        return this.c.toDataURL();
    }
}

const Session = new CanvasHandler(document.body, 4, 3);

Session.addEventListener('mousedown', function (objects, e) {

    const object = objects[objects.length - 1];
    if (!object) return;

    object.x = e.x;
    object.y = e.y;

    Session.draw();
});


({
    "type": "DRAW_MODE_ROUND",
    "value": [{
        "type": "pU",
        "value": {
            "key": "drawingBase64",
            "value": "data:image/jpeg;base64,"
        }
    }]
})
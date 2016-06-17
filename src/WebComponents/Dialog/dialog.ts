namespace Vidyano.WebComponents {
    "use strict";

    export abstract class Dialog extends WebComponent {
        private _sizeTracker: Vidyano.WebComponents.SizeTracker;
        private _translatePosition: IPosition;
        protected resolve: Function;
        protected reject: Function;
        noCancelOnOutsideClick: boolean;
        noCancelOnEscKey: boolean;
        noHeader: boolean;

        attached() {
            if (!this._sizeTracker) {
                Polymer.dom(this.root).appendChild(this._sizeTracker = new Vidyano.WebComponents.SizeTracker());
                this._sizeTracker.bubbles = true;
            }

            super.attached();
        }

        /**
         * Open the overlay.
         */
        private open: () => void;

        /**
         * Close the overlay.
         */
        private close: () => void;

        show(): Promise<any> {
            let trackHandler: Function;
            const header = <HTMLElement>Polymer.dom(this.root).querySelector("header");
            if (header)
                Polymer.Gestures.add(header, "track", trackHandler = this._track.bind(this));

            return new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;

                this.open();
            }).then(result => {
                if (trackHandler)
                    Polymer.Gestures.remove(header, "track", trackHandler);

                this.close();
                return result;
            });
        }

        private _dialogSizeChanged(e: CustomEvent, details: ISize) {
            (<any>this).notifyResize();

            e.stopPropagation();
        }

        private _track(e: PolymerTrackEvent) {
            const detail = <PolymerTrackDetail>e.detail;
            if (!e.detail.sourceEvent.srcElement.tagName.startsWith("H")) {
                e.stopPropagation();
                e.preventDefault();

                return;
            }

            if (detail.state === "track") {
                this._translate({
                    x: this._translatePosition.x + detail.ddx,
                    y: this._translatePosition.y + detail.ddy
                });
            }
            else if (detail.state === "start") {
                this.app.isTracking = true;
                if (!this._translatePosition)
                    this._translate({ x: 0, y: 0 });

                this.setAttribute("dragging", "");
            }
            else if (detail.state === "end") {
                this.removeAttribute("dragging");
                this.app.isTracking = false;
            }
        }

        private _translate(position: IPosition) {
            this._translatePosition = position;
            this.style.webkitTransform = this.style.transform = `translate(${position.x}px, ${position.y}px)`;
        }

        static register(info: IWebComponentRegistrationInfo = {}, prefix?: string): any {
            if (typeof info === "function")
                return Dialog.register({})(info);

            return (obj: Function) => {
                info.properties = info.properties || {};

                info.properties["noHeader"] = {
                    type: Boolean,
                    readOnly: true,
                    reflectToAttribute: true
                };

                info.listeners = info.listeners || {};
                info.listeners["sizechanged"] = "_dialogSizeChanged";

                info.behaviors = info.behaviors || [];
                info.behaviors.push(Polymer["IronOverlayBehavior"]);
                info.behaviors.push(Polymer["IronResizableBehavior"]);

                info.hostAttributes = info.hostAttributes || {};
                info.hostAttributes["dialog"] = "";
                info.hostAttributes["with-backdrop"] = "";

                return WebComponent.register(obj, info, prefix);
            };
        }
    }
}
/// <reference path="../typings/index.d.ts" />

const _ = require('lodash');

class World {

	/**
	 * Create minesweeper world.
	 * @param {Element} $element
	 */
	constructor($element) {
		const height = 10;
		const width = 10;
		const minesLength = 10;

		const mines = _.slice(_.shuffle(_.map(Array(height * width), (a, i) => i)), 0, minesLength);

		const cels = [];
		for (let i = 0; i < height; i += 1) {
			const $line = document.createElement('div');
			$line.classList.add('line');
			$element.appendChild($line);
			for (let j = 0; j < width; j += 1) {
				const index = j + i * width;
				const cel = new Cel(this, $line, _.includes(mines, index), index);
				$line.appendChild(cel.$element);
				cels.push(cel);
			}
		}

		this.cels = cels;
		this.width = width;
		this.height = height;
	}

	/**
	 * Calculate index.
	 * @param {Number} index
	 * @param {Number} dx
	 * @param {Number} dy
	 */
	dindex(index, dx, dy) {
		return index + dx + dy * this.width;
	}

	/**
	 * Search around mines.
	 * @param {Number} index
	 */
	chain(index) {
		_.forEach([
			[-1, -1], [0, -1], [1, -1],
			[-1, 0], [1, 0],
			[-1, 1], [0, 1], [1, 1]
		], ([dx, dy]) => {
			const i = this.dindex(index, dx, dy);
			const col = this.cels[i];
			if (!col || col.hasMine || col.hasSweeped || col.hasFlag) { return; }
			col.sweeped();
			if (col.searchMines() === 0) {
				this.chain(i);
			}
		});
	}
}

class Cel {

	/**
	 * Create mainsweeper cel.
	 * @param {World} world
	 * @param {Element} $parent
	 * @param {Boolean} hasMine
	 * @param {Number} index
	 */
	constructor(world, $parent, hasMine, index) {
		const $element = document.createElement('div');
		$element.classList.add('cel', 'no-flag', 'no-mine');
		const $value = document.createElement('div');
		$value.classList.add('value');
		_.forEach([$value, Cel.createFlagElement(), Cel.createMineElement()], (a) => $element.appendChild(a));
		$element.addEventListener('contextmenu', this.clickListener.bind(this));
		$element.addEventListener('click', this.clickListener.bind(this));

		this.$value = $value;
		this.world = world;
		this.$element = $element;
		this.hasMine = hasMine;
		this.index = index;
		this.hasFlag = false;
		this.hasSweeped = false;
	}

	/**
	 * Open cel.
	 */
	sweeped() {
		this.hasSweeped = true;
		this.$element.classList.add('open');
		if (this.hasMine) {
			this.$element.classList.remove('no-mine');
		}
	}

	/**
	 * Click listener.
	 */
	clickListener() {
		event.preventDefault();
		const $target = event.currentTarget;
		const {button} = event;

		if (this.hasSweeped) { return; }
		if (button === 2) {
			this.hasFlag = !$target.classList.toggle('no-flag');
		} else if (button === 0) {
			this.sweeped();
			if (this.hasMine) {
				alert('YO!');
			} else if (this.searchMines() === 0) {
				this.world.chain(this.index);
			}
		}
	}

	/**
	 * Search around mines.
	 * @returns {Number}
	 */
	searchMines() {
		const {index} = this;
		let sum = 0;
		_.forEach([
			[-1, -1], [0, -1], [1, -1],
			[-1, 0], [1, 0],
			[-1, 1], [0, 1], [1, 1]
		], ([dx, dy]) => {
			const i = this.world.dindex(index, dx, dy);
			const cel = this.world.cels[i];
			if (!cel) { return; }
			if (cel.hasMine) {
				sum += 1;
			}
		});

		if (sum) {
			this.value = sum;
		}

		return sum;
	}

	set value(value) {
		this.$value.innerText = value;
	}

	/**
	 * Create a mine element.
	 * @returns {Element}
	 */
	static createMineElement() {
		const $i = document.createElement('i');
		$i.setAttribute('aria-hidden', true);
		$i.classList.add('fa', 'fa-star');
		return $i;
	}

	/**
	 * Create a flag element.
	 * @returns {Element}
	 */
	static createFlagElement() {
		const $i = document.createElement('i');
		$i.setAttribute('aria-hidden', true);
		$i.classList.add('fa', 'fa-flag');
		return $i;
	}
}

new World(document.querySelector('.world-field'));
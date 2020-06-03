const isEnvBrowser = typeof window !== 'undefined';
const isEnvNode = !isEnvBrowser && module && module.exports;

// const NEGLIGIBLE_SYMBOLS = '+- _';
const TEL_CODE_RU = '7';
const TEL_CODE_MARI_EL = '8362';
const telCode = (code) => `+${code}`;

const CLASS_VIDEO_WRAPPER = 'video_wrapper';
const CLASS_TOP_BLOCK_VIDEO = 'top_block_video';
const CLASS_CUSTOM_PLAY_BUTTON = 'custom_play_button';
const CLASS_VIDEO_POSTER = 'video_poster';
const CLASS_VIDEO_FRAME = 'video_frame';

const VIDEOS = [
    {
        sectionClassName: 'main_info_section',
        poster: 'images/video/sport.jpg'
    },
    {
        sectionClassName: 'dancing_section',
        poster: 'images/video/dancing-group.jpg'
    }
];

if (isEnvBrowser) {
    /*
        Custom play buttons and posters for videos
    */
    const videos = VIDEOS
        .map( video => ({
            ...video, domElement: document.querySelector(`.${video.sectionClassName} .${CLASS_VIDEO_WRAPPER}`)
        }) )
        .filter( ({ domElement }) => domElement );
    
    
    for (const { poster, domElement } of videos) {
        domElement.addEventListener('click', () => {
            if (domElement.classList.contains(CLASS_CUSTOM_PLAY_BUTTON)) {
                domElement.classList.remove(CLASS_CUSTOM_PLAY_BUTTON);
                domElement.querySelector(`.${CLASS_VIDEO_FRAME}`).src += '&autoplay=1';
            }
        });
    
        domElement.querySelector(`.${CLASS_VIDEO_POSTER}`).src = poster;
        domElement.classList.add(CLASS_CUSTOM_PLAY_BUTTON);
    }
    
    /*
        Mask for input element for tel. number
    */
    for (const input of document.querySelectorAll('.form_input[type="tel"]')) {
        input.addEventListener('input', formatTelephoneNumberInput);
        input.addEventListener('keypress', formatTelephoneNumberInput);
        input.addEventListener('focus', formatTelephoneNumberInput);
        input.addEventListener('selectionchange', formatTelephoneNumberInput);

        input.addEventListener('blur', ({ target }) => {
            if (makeTelephoneNumberSimplest(target.value).value === TEL_CODE_RU) {
                target.value = '';
            }
        });
    }

    /*
        Form
    */
    const CLASS_LOADING = 'loading';
    const CLASS_COMPLETED = 'completed';

    for (const form of document.querySelectorAll('form')) {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const form = event.target;
            const { action: url, method } = form;
            const data = {};

            for (const { name, value } of document.querySelectorAll('input')) {
                data[name] = value;
            }

            const fetchWorker = new Worker('js/fetch-form-via-worker.js');
            // Worker is needed to prevent redirection on fetch response
            // FIXME: try iframe instead.

            form.classList.add(CLASS_LOADING);
            form.querySelector('button[type="submit"]').disabled = true;
            
            fetchWorker.onmessage = (e) => {
                const { data: { completed } } = e;
                
                // NOTE: "completed" don't means success.
                // Request fetching with no-cors
                // so we can not to know response status
                // Google-form should to return status 200.

                // ВАЖНО: "completed" не означает успех.
                // Запрос посылается в режиме no-cors,
                // так что мы не можем знать статус ответа.
                // По идее, Гугл-форма должна всегда возвращать 200.
                
                form.classList.remove(CLASS_LOADING);

                if (completed) {
                    form.classList.add(CLASS_COMPLETED);
                    dataLayer.push({'event': 'form-submit'});
                }
            };

            fetchWorker.postMessage({ url, method, data });
        });
    }
}

/**
 * Format a telephone number in the input field.
 * 
 * Как работает маска телефона:
 * 
 * Начальное «+7» зафиксировано и его нельзя удалить
 * 
 * Пользователь нажал Backspace
 *     Тултип: «Вы хотите ввести городской номер Марий Эл?»
 *         да => Дописать код города 8362
 *         нет => Извините. Мы сможем позвонить только на российский номер.
 * 
 * Ввёл «9» -> «+7 9__ ___-__-__»
 *     Код оператора (единственное исключение - какой-то остров с кодом 90 и населением 900 человек)
 * 
 * Ввёл «2» -> «+7 2_»
 *     Городской телефон. Отбиваем только последние 6 цифр дефисами по парам, так как не знаем длину кода города * 
 * Ввёл «8362» -> «+7 (8362) __-__-__»
 *     Такой код городского номера мы знаем. Это Республика Марий Эл.
 * 
 * Ввёл «912345» -> «+7 912 345-__-__»
 *     Не понятно, это незаконченный сотовый, или пользователь не заметил +7
 *     Тултип после короткой паузы: «Вы ввели городской номер Марий Эл?»
 *         да => Дописать код города 8362
 *         нет => Это сотовый
 *     ? Пауза длиннее средней паузы между набором цифр
 */
function formatTelephoneNumberInput(event) {
    const { type } = event;

    // if (type === 'keypress') {
    //     const { key, preventDefault } = event;

    //     if (!isDigit(key)) {
    //         preventDefault();
    //     }
    // }

    const { inputType, target } = event;
    const { selectionStart, selectionEnd } = target;

    if (type === 'keydown') {
        const { key, preventDefault } = event;

        if (!isDigit(key) && key !== 'Backspace' && key !== 'Delete') {
            preventDefault();
        }

        if (selectionStart !== selectionEnd) {
            return;
        }

        // const shift = selectionStart !== selectionEnd ? 0 : inputType === 'deleteContentBackward' && !isDigit(target.value[selectionStart - 1]) ? -1 : inputType === 'deleteContentForward' && !isDigit(target.value[selectionStart]) ? 1 : 0;
        // FIXME: Shift length = 1 is coincidence only. Shold calclulate real length.
        
        // const shift = 0;
        // const start = selectionStart + shift;
        // const end = selectionEnd + shift;
        
        // const { value, cursorPos } = formatTelephoneNumber(target.value, target.selectionStart);

        // const { cursorPos } = formatTelephoneNumber(target.value.slice(0, start), start, true);
        // const { value } = formatTelephoneNumber(target.value.slice(0, start) + target.value.slice(start), start);
        
        if (key === 'Backspace') {
            preventDefault();

            const beforeCursor = makeTelephoneNumberSimplest(
                target.value.slice(0, selectionStart),
                [selectionStart, selectionStart - 1]
            );

            const cursor = selectionStart - beforeCursor.countOfDeletedSymbol
            
            const { value, cursorPos } = formatTelephoneNumber(
                beforeCursor.value.slice(0, beforeCursor.value.length - 1)
                    + target.value.slice(selectionStart),
                selectionStart - 1
            );

            setTimeout(() => {
                target.setRangeText(value.slice(cursorPos), 0, target.value.length, 'end');
                target.setRangeText(value.slice(0, cursorPos), 0, 0, 'end');
            });
        }

        if (key === 'Delete') {
            // 
        }
    }

    if (inputType === 'insertText' || inputType === 'insertFromPaste' || type === 'focus') {
        const { value, cursorPos } = formatTelephoneNumber(target.value, selectionStart, type === 'focus');

        target.setRangeText(value.slice(cursorPos), 0, target.value.length, 'end');
        target.setRangeText(value.slice(0, cursorPos), 0, 0, 'end');
        // Setting in two steps to set cursor in middle of inserted text.

        if (type === 'focus') {
            setTimeout(() => {
                target.setSelectionRange(cursorPos, cursorPos);
            });
        }
    }

    // if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
    //     if (selectionStart !== selectionEnd) {
    //         return true;
    //     }

    //     const shift = selectionStart !== selectionEnd ? 0 : inputType === 'deleteContentBackward' && !isDigit(target.value[selectionStart - 1]) ? -1 : inputType === 'deleteContentForward' && !isDigit(target.value[selectionStart]) ? 1 : 0;
    //     // FIXME: Shift length = 1 is coincidence only. Shold calclulate real length.
        
    //     // const shift = 0;
    //     const start = selectionStart + shift;
    //     // const end = selectionEnd + shift;
        
    //     // const { value, cursorPos } = formatTelephoneNumber(target.value, target.selectionStart);

    //     // const { cursorPos } = formatTelephoneNumber(target.value.slice(0, start), start, true);
    //     // const { value } = formatTelephoneNumber(target.value.slice(0, start) + target.value.slice(start), start);
        
    //     if (inputType === 'deleteContentBackward') {
    //         const beforeCursor = makeTelephoneNumberSimplest(target.value.slice(0, selectionStart)).value;
            
    //         const { value, cursorPos } = formatTelephoneNumber(
    //             beforeCursor.slice(0, beforeCursor.length - 1)
    //                 + target.value.slice(selectionStart),
    //             selectionStart - 1
    //         );
    //         target.setRangeText(value.slice(cursorPos), 0, target.value.length, 'end');
    //         target.setRangeText(value.slice(0, cursorPos), 0, 0, 'end');
    //     }

    //     // target.value = formatTelephoneNumber(simplest.value.slice(0, simplest.value.length - 1)).value;

    //     // setTimeout(() => {
    //     //     target.setSelectionRange(target.selectionStart, target.selectionStart);
    //     // });
    // }
}

/*
    Functions:
*/

function isCharDigit(char) {
    return char.length === 1 && '0' <= char && char <= '9';
}

function isDigit(string) {
    return [...string].every(isCharDigit);
}

/**
 * Delete not digit symbols from telephone number.
 * @param {string} tel - tel. number.
 * @param {number[]} breakpoints - breakpoints to count deleted symbols before breakpoint position.
 */
function makeTelephoneNumberSimplest(tel, breakpoints = []) {
    let value = '';
    const countOfDeletedSymbol = {};

    for (const breakpoint of breakpoints) {
        countOfDeletedSymbol[breakpoint] = 0;
    }

    for (const [i, char] of [...tel].entries()) {
        if (isDigit(char)) {
            value += char;
        } else {
            for (const breakpoint of breakpoints) {
                if (i <= breakpoint) {
                    countOfDeletedSymbol[breakpoint] += 1;
                }
            }
        }
    }

    return {
        value,
        countOfDeletedSymbol
    };
}

/**
 * Format telephone number and get new cursor position.
 */
function formatTelephoneNumber(number, selectionStart, cursorAtEnd) {
    const PLACE_FOR_DIGIT = '_';

    const simplest = makeTelephoneNumberSimplest(number, [selectionStart]);
    number = simplest.value;

    if (number === '') {
        number = TEL_CODE_RU;
    }

    const mobilePhoneParts = [
        ['+', TEL_CODE_RU],
        [' ', '999'],
        [' ', '123'],
        ['-', '45'],
        ['-', '67']
    ];

    let start = 0;
    let value = '';
    // let previousPartIsComplete;
    let cursorPos;
    let cursorShift = 0;
    let previousIsComplete = false;

    for (const [prefix, { length }] of mobilePhoneParts) {
        const part = number.slice(start, start += length);
        const partWithPrefix = prefix + part;

        const emptyPlaces = length - part.length;
        value += partWithPrefix + PLACE_FOR_DIGIT.repeat(emptyPlaces);

        if (part || previousIsComplete) {
            cursorPos = value.length - emptyPlaces;
        }

        if (!part && previousIsComplete) {
            // NOTE: "start" in condition means "end". FIXME
            cursorShift = prefix.length;
        }
        previousIsComplete = !emptyPlaces;

        // if (part || previousPartIsComplete) {
        // }

        previousPartIsComplete = part.length === length;

        // if (!part) {
        //     break;
        // }
    }

    if (!cursorAtEnd) {
        cursorPos = Math.min(cursorPos, selectionStart + cursorShift);
    }

    return {
        value,
        cursorPos,
        cursorShift
    };
}

if (isEnvNode) {
    module.exports = {
        makeTelephoneNumberSimplest,
        formatTelephoneNumber,
    }
}

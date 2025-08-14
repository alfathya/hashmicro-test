const calculateCharacterPercentage = (req, res) => {
    try {
        console.log('test check')
        const { input1, input2 } = req.body;
        
        if (!input1 || !input2) {
            return res.status(400).json({
                success: false,
                message: 'Both input1 and input2 are required'
            });
        }
        
        const input1Lower = input1.toLowerCase();
        const input2Lower = input2.toLowerCase();

        const uniqueCharsInput1 = [];
        for (let i = 0; i < input1Lower.length; i++) {
          let isDuplicate = false;
          for (let j = 0; j < uniqueCharsInput1.length; j++) {
            if (uniqueCharsInput1[j] === input1Lower[i]) {
              isDuplicate = true;
              break;
            }
          }
          if (!isDuplicate) {
            uniqueCharsInput1.push(input1Lower[i]);
          }
        }
        
        let matchingChars = 0;
        const matchedCharsList = [];
        
        uniqueCharsInput1.forEach(char => {
            if (input2Lower.includes(char)) {
                matchingChars++;
                matchedCharsList.push(char.toUpperCase());
            }
        });
        
        const percentage = parseFloat(((matchingChars / uniqueCharsInput1.length) * 100).toFixed(2));
        
        const result = {
            success: true,
            data: {
                input1: input1,
                input2: input2,
                uniqueCharactersInput1: uniqueCharsInput1.length,
                uniqueCharactersList: uniqueCharsInput1.map(c => c.toUpperCase()),
                matchingCharacters: matchingChars,
                matchedCharactersList: matchedCharsList,
                percentage: percentage,
                calculation: `${matchingChars}/${uniqueCharsInput1.length} = ${percentage}%`
            }
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Error in calculateCharacterPercentage:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    calculateCharacterPercentage
};
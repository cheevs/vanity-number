# Vanity Number Generator

The vanity number generator is an Amazon Connect contact flow and serverless application.
The contact flow will allow the user to call a number to hear three of the generated results.
The webapp will allow the user to see the top five vanity numbers generated.


### Try it out yourself!
Amazon Connect phone number: 619-866-0474

View Results on the Website: TODO: add url


### High Level Architecture

### Algorithm - Generating Vanity Numbers
Amazon Connect lambda integrations can only run for a maximum of 8 seconds.
The intial implementation execution time was greater than 30 seconds so this had to be fixed.
The initial implementation used a backtracking algorithm (reference: https://www.geeksforgeeks.org/find-possible-words-phone-digits/)
The backtracking algorithm had an exponential time complexity O(4^n).

Optimization to get execution time under 8 seconds:
##### 1. Reduce Dictionary Size
All words from the dictionary greater than 5 and less than 2 were removed from the dictionary.
Roughly reducing the size of the possible matches by ~50%.

##### 2. Reduce Number of Permutations
The permise behind this logic is the low probability for finding a match on words greater than 5.
So the optimization is to only calculate the permutations of 5 numbers instead of 10.

Generating all permutuations for the 10 digit phone number would be 10! = 3,628,800 total permutations.
The phone number is split into 5 chunks of 5 reducing the total permutations to 5! * 5 = 600 (way better than 10!)

Example: Phone number 773-272-5374 =>   
```
[ '7', '7', '3', '2', '7' ],
[ '7', '3', '2', '7', '2' ],
[ '3', '2', '7', '2', '5' ],
[ '2', '7', '2', '5', '3' ],
[ '7', '2', '5', '3', '7' ],
[ '2', '5', '3', '7', '4' ]
```

##### 3. Asynchronous Code
This optimization is to process all the chunks asynchronously further increasing performance.
Javascript makes integrating asynchronous code seemless.
```
const promises = chunks.map(async (chunk) => permutateString(...));

await Promise.all(promises);
```

These three optimization reduced the total execution time from 30s to less than 4s.



## Requirements for installation
* docker - used by the `NodeJsFunction` for bundling the lambda
## Useful commands

 * `npm run test`         perform the jest unit tests
 * `cdk deploy`           deploy this stack to your default AWS account/region
 * `cdk diff`             compare deployed stack with current state
 * `cdk synth`            emits the synthesized CloudFormation template

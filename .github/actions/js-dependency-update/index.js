const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const SetupGithub = async() => {
 await exec.exec(`git config --global user.name "gh-automation"`)
 await exec.exec(`git config --global user.email "gh-automation@email.com"`)
}


const SetupLogger = ({ debug, prefix} = {debug: false, prefix: ''}) => ({
    debug: (message) => {
        if ( debug ) {
            core.info(`Debug ${prefix} ${prefix? ':' :''}${message}`);
        }
    },
    error: (message) => {
        core.error(`${prefix} ${prefix? ':' : ''}${message}`);

    }
});


const validateBranchName =({branchName}) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({dirName}) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

async function run(){
    core.info('I am a custom js function');
    const baseBranch = core.getInput('base-branch', {required: true});
    const headBranch = core.getInput('head-branch', {required: true});
    const workDir = core.getInput('working-directory', {required: true});
    const debug = core.getBooleanInput('debug');
    const ghToken = core.getInput('gh-token', {required: true});
    const logger = SetupLogger({debug, prefix: '[js-dependency-update]'})

    const commonExecOps ={
        cwd:workDir
    }
    core.setSecret('ghToken')

    logger.debug('validating inputs, base branch,');

    core.info(`Base branch received: "${baseBranch}"`);

    if(!validateBranchName({branchName: baseBranch})){
        core.setFailed('invalid base-branch name')
        return;
    }

    if(!validateBranchName({branchName: headBranch})){
        core.setFailed('invalid head-branch')
        return;   
    }

    if(!validateDirectoryName({dirName: workDir})){
        core.setFailed('invalid work dir')
        return;
    }

    logger.debug(`base branch is ${baseBranch}`);
    core.info(`base branch is ${headBranch}`);
    core.info(`base branch is ${workDir}`);


    await exec.exec(`npm update`, [],{
        ...commonExecOps
    });

    const gitStatus = await exec.getExecOutput(`git status -s package*.json`, [],{
        ...commonExecOps,
    });

    if(gitStatus.stdout.length > 0){
        core.info('update available')
        await SetupGithub();
        logger.debug('adding git credentails')
        await exec.exec(`git checkout -b ${headBranch}`,[],{
            ...commonExecOps
        });
         await exec.exec(`git add package.json package-lock.json`,[],{
            ...commonExecOps
        });
         await exec.exec(`git commit -m "chore(updated-dependencies)"`,[],{
            ...commonExecOps
        });
         await exec.exec(`git push -u origin ${headBranch} --force `,[],{
            ...commonExecOps
        });
        
        logger.debug('completed with git commands')
    try{
        const octoKit = github.getOctokit(ghToken);
        await octoKit.rest.pulls.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: 'Update NPM packages',
            body: 'This pulls NPM packages',
            base: baseBranch,
            head: headBranch

        });
    }
    catch(e)
    {
        logger.error('index.js - error: something went wrong. check logs');
        logger.error(e.message);
        logger.error(e);
    }
        
    } 
    else
    {
        core.info('no info')
    }


}

run();
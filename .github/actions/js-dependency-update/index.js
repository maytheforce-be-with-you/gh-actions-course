const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');

const validateBranchName =({branchName}) => /^[a-zA-Z0-9_\-\.\/]+$/.test(branchName);
const validateDirectoryName = ({dirName}) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

async function run(){
    core.info('I am a custom js function');
    const baseBranch = core.getInput('base-branch', {required: true});
    const targetBranch = core.getInput('target-branch', {required: true});
    const workDir = core.getInput('working-directory', {required: true});
    const debug = core.getBooleanInput('debug');
    const ghToken = core.getInput('gh-token', {required: true});

    const commonExecOps ={
        cwd:workDir
    }
    core.setSecret('ghToken')

    core.info(`Base branch received: "${baseBranch}"`);

    if(!validateBranchName({branchName: baseBranch})){
        core.setFailed('invalid base-branch name')
        return;
    }

    if(!validateBranchName({branchName: targetBranch})){
        core.setFailed('invalid target-branch')
        return;   
    }

    if(!validateDirectoryName({dirName: workDir})){
        core.setFailed('invalid work dir')
        return;
    }

    core.info('[js-dependency-update]: base branch is ${baseBranch}');
    core.info('[js-dependency-update]: base branch is ${targetBranch}');
    core.info('[js-dependency-update]: base branch is ${workDir}');


    await exec.exec(`npm update`, [],{
        ...commonExecOps
    });

    const gitStatus = await exec.getExecOutput(`git status -s package*.json`, [],{
        ...commonExecOps,
    });

    if(gitStatus.stdout.length > 0){
        core.info('update available')
        await exec.exec(`git config --global user.name "gh-automation"`)
        await exec.exec(`git config --global user.email "gh-automation@email.com"`)
        await exec.exec(`git checkout -b ${targetBranch}`,[],{
            ...commonExecOps
        });
         await exec.exec(`git add package.json package-lock.json`,[],{
            ...commonExecOps
        });
         await exec.exec(`git commit -m "chore(updated-dependencies)"`,[],{
            ...commonExecOps
        });
         await exec.exec(`git push -u origin ${targetBranch} --force `,[],{
            ...commonExecOps
        });

    try{
        const octoKit = github.getOctokit(ghToken);
        await octoKit.rest.pulls.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            title: 'Update NPM packages',
            body: 'This pulls NPM packages',
            base: baseBranch,
            head: targetBranch

        });
    }
    catch(e)
    {
        core.error('index.js - error: something went wrong. check logs');
        core.error(e.message);
        core.error(e);
    }
        
    } 
    else
    {
        core.info('no info')
    }


}

run();
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

// ---------------------------------------------------------------------------
// Git Operations API
// Uses isomorphic-git for browser/Node.js git operations.
// Falls back to native git commands where isomorphic-git has limitations.
// ---------------------------------------------------------------------------

// Default directory for git operations (workspace root)
function getWorkDir(body: Record<string, unknown> | null): string {
  if (body?.workDir && typeof body.workDir === 'string') {
    return body.workDir;
  }
  return process.env.WORKSPACE_DIR || process.cwd();
}

/**
 * POST /api/git
 * Execute git operations.
 * Body: { action: 'init'|'add'|'commit'|'push'|'pull'|'branch'|'merge', ...params }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const dir = getWorkDir(body);

    switch (action) {
      case 'init':
        return await handleInit(dir);
      case 'add':
        return await handleAdd(dir, body);
      case 'commit':
        return await handleCommit(dir, body);
      case 'push':
        return await handlePush(dir, body);
      case 'pull':
        return await handlePull(dir, body);
      case 'branch':
        return await handleBranch(dir, body);
      case 'merge':
        return await handleMerge(dir, body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: init, add, commit, push, pull, branch, merge` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git operation failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/git
 * Retrieve git information.
 * Query params:
 *   - action=log|diff|status|branches|remotes
 *   - workDir: working directory
 *   - file: file path (for diff)
 *   - depth: log depth (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';
    const workDir = searchParams.get('workDir') || process.env.WORKSPACE_DIR || process.cwd();
    const file = searchParams.get('file') || '';
    const depth = parseInt(searchParams.get('depth') || '50', 10);

    switch (action) {
      case 'log':
        return await handleLog(workDir, depth);
      case 'diff':
        return await handleDiff(workDir, file);
      case 'status':
        return await handleStatus(workDir);
      case 'branches':
        return await handleListBranches(workDir);
      case 'remotes':
        return await handleListRemotes(workDir);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Supported: log, diff, status, branches, remotes` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git operation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Action Handlers
// ---------------------------------------------------------------------------

async function handleInit(dir: string) {
  try {
    await git.init({ fs, dir });
    return NextResponse.json({
      success: true,
      action: 'init',
      message: `Git repository initialized in ${dir}`,
      dir,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git init failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleAdd(dir: string, body: Record<string, unknown>) {
  const filepath = body.filepath as string | undefined;

  if (!filepath) {
    return NextResponse.json(
      { error: 'filepath is required' },
      { status: 400 }
    );
  }

  try {
    if (filepath === '.' || filepath === '-A' || filepath === '--all') {
      // Stage all files: get all files and add them
      const statusMatrix = await git.statusMatrix({ fs, dir });
      const filesToAdd = (statusMatrix as (string | number)[][])
        .filter((row) => row[1] !== row[2]) // working tree differs from staged
        .map((row) => row[0] as string);

      for (const file of filesToAdd) {
        await git.add({ fs, dir, filepath: file });
      }

      return NextResponse.json({
        success: true,
        action: 'add',
        message: `Staged ${filesToAdd.length} file(s)`,
        files: filesToAdd,
      });
    }

    await git.add({ fs, dir, filepath });
    return NextResponse.json({
      success: true,
      action: 'add',
      message: `Staged ${filepath}`,
      filepath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git add failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleCommit(dir: string, body: Record<string, unknown>) {
  const message = body.message as string | undefined;
  const author = body.author as { name?: string; email?: string } | undefined;

  if (!message) {
    return NextResponse.json(
      { error: 'message is required for commit' },
      { status: 400 }
    );
  }

  try {
    const sha = await git.commit({
      fs,
      dir,
      message,
      author: {
        name: author?.name || process.env.GIT_AUTHOR_NAME || 'AICodeStudio',
        email: author?.email || process.env.GIT_AUTHOR_EMAIL || 'ide@aicodestudio.dev',
      },
    });

    return NextResponse.json({
      success: true,
      action: 'commit',
      message: `Committed: ${message}`,
      commitHash: sha,
    });
  } catch (error: unknown) {
    const message_ = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git commit failed: ${message_}` },
      { status: 500 }
    );
  }
}

async function handlePush(dir: string, body: Record<string, unknown>) {
  const remote = (body.remote as string) || 'origin';
  const ref = body.ref as string | undefined;
  const authToken = body.authToken as string | undefined;

  try {
    const pushOptions: Parameters<typeof git.push>[0] = {
      fs,
      http,
      dir,
      remote,
      ref,
      onAuth: () => {
        if (authToken) {
          return {
            username: authToken,
            password: '',
          };
        }
        return undefined;
      },
    };

    const result = await git.push(pushOptions);

    return NextResponse.json({
      success: true,
      action: 'push',
      message: `Pushed to ${remote}${ref ? `/${ref}` : ''}`,
      result: {
        ok: result?.ok,
        error: result?.error,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git push failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handlePull(dir: string, body: Record<string, unknown>) {
  const remote = (body.remote as string) || 'origin';
  const ref = body.ref as string | undefined;
  const authToken = body.authToken as string | undefined;

  try {
    const pullOptions: Parameters<typeof git.pull>[0] = {
      fs,
      http,
      dir,
      remote,
      ref,
      onAuth: () => {
        if (authToken) {
          return {
            username: authToken,
            password: '',
          };
        }
        return undefined;
      },
    };

    await git.pull(pullOptions);

    return NextResponse.json({
      success: true,
      action: 'pull',
      message: `Pulled from ${remote}${ref ? `/${ref}` : ''}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git pull failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleBranch(dir: string, body: Record<string, unknown>) {
  const branchName = body.name as string | undefined;
  const checkout = body.checkout as boolean | undefined;
  const startPoint = body.startPoint as string | undefined;

  if (!branchName) {
    return NextResponse.json(
      { error: 'name is required for branch action' },
      { status: 400 }
    );
  }

  try {
    // Create branch
    await git.branch({
      fs,
      dir,
      ref: branchName,
      object: startPoint,
    });

    // Optionally checkout the new branch
    if (checkout) {
      await git.checkout({ fs, dir, ref: branchName });
    }

    return NextResponse.json({
      success: true,
      action: 'branch',
      message: `Branch ${branchName} created${checkout ? ' and checked out' : ''}`,
      branch: branchName,
      checkedOut: !!checkout,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git branch failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleMerge(dir: string, body: Record<string, unknown>) {
  const ours = body.ours as string | undefined;
  const theirs = body.theirs as string | undefined;
  const author = body.author as { name?: string; email?: string } | undefined;

  if (!theirs) {
    return NextResponse.json(
      { error: 'theirs (branch to merge) is required' },
      { status: 400 }
    );
  }

  try {
    const mergeResult = await git.merge({
      fs,
      dir,
      ours: ours || undefined,
      theirs,
      author: {
        name: author?.name || process.env.GIT_AUTHOR_NAME || 'AICodeStudio',
        email: author?.email || process.env.GIT_AUTHOR_EMAIL || 'ide@aicodestudio.dev',
      },
    });

    return NextResponse.json({
      success: true,
      action: 'merge',
      message: `Merged ${theirs}${ours ? ` into ${ours}` : ''}`,
      mergeResult: {
        oid: mergeResult.oid,
        alreadyMerged: mergeResult.alreadyMerged,
        fastForward: mergeResult.fastForward,
        mergeCommit: mergeResult.mergeCommit,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git merge failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleLog(dir: string, depth: number) {
  try {
    const commits = await git.log({
      fs,
      dir,
      depth,
    });

    const logEntries = commits.map((entry) => ({
      oid: entry.oid,
      message: entry.commit.message,
      author: {
        name: entry.commit.author.name,
        email: entry.commit.author.email,
      },
      timestamp: entry.commit.author.timestamp,
      parent: entry.commit.parent,
    }));

    return NextResponse.json({
      success: true,
      action: 'log',
      commits: logEntries,
      total: logEntries.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git log failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleDiff(dir: string, file: string) {
  try {
    if (file) {
      // Get diff for a specific file
      const status = await git.status({ fs, dir, filepath: file });

      // Get the file content in HEAD vs working tree
      let oldContent = '';
      let newContent = '';

      try {
        const headCommit = await git.resolveRef({ fs, dir, ref: 'HEAD' });
        const { blob } = await git.readBlob({
          fs,
          dir,
          oid: headCommit,
          filepath: file,
        });
        oldContent = new TextDecoder().decode(blob);
      } catch {
        oldContent = '';
      }

      try {
        newContent = fs.readFileSync(path.join(dir, file), 'utf-8');
      } catch {
        newContent = '';
      }

      return NextResponse.json({
        success: true,
        action: 'diff',
        file,
        status,
        oldContent,
        newContent,
      });
    }

    // Get overall status matrix for all changed files
    const statusMatrix = await git.statusMatrix({ fs, dir });

    const changes = (statusMatrix as (string | number)[][])
      .filter((row) => row[1] !== row[2] || row[2] !== row[3])
      .map((row) => {
        const filepath = row[0] as string;
        const head = row[1] as number;
        const workdir = row[2] as number;
        const stage = row[3] as number;

        let status: string;
        if (head === 0 && workdir === 2) {
          status = 'added';
        } else if (head === 1 && workdir === 0) {
          status = 'deleted';
        } else if (head === 1 && workdir === 2 && stage === 2) {
          status = 'modified';
        } else if (head === 1 && workdir === 2 && stage === 3) {
          status = 'modified-staged';
        } else {
          status = 'changed';
        }

        return { filepath, status, head, workdir, stage };
      });

    return NextResponse.json({
      success: true,
      action: 'diff',
      changes,
      total: changes.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git diff failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleStatus(dir: string) {
  try {
    const statusMatrix = await git.statusMatrix({ fs, dir });

    const files = statusMatrix.map((row: (string | number)[]) => {
      const filepath = row[0] as string;
      const head = row[1] as number;
      const workdir = row[2] as number;
      const stage = row[3] as number;

      let status: string;
      if (head === 0 && workdir === 2) {
        status = 'untracked';
      } else if (head === 1 && workdir === 0) {
        status = 'deleted';
      } else if (head === 1 && workdir === 2 && stage === 1) {
        status = 'unmodified';
      } else if (head === 1 && workdir === 2 && stage === 2) {
        status = 'modified';
      } else if (head === 1 && workdir === 2 && stage === 3) {
        status = 'staged';
      } else {
        status = 'changed';
      }

      return { filepath, status };
    });

    // Get current branch
    let currentBranch = 'HEAD';
    try {
      currentBranch = await git.currentBranch({ fs, dir }) || 'HEAD';
    } catch {
      // May not be on a branch
    }

    return NextResponse.json({
      success: true,
      action: 'status',
      branch: currentBranch,
      files,
      total: files.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git status failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleListBranches(dir: string) {
  try {
    const branches = await git.listBranches({ fs, dir });
    let currentBranch = 'HEAD';

    try {
      currentBranch = (await git.currentBranch({ fs, dir })) || 'HEAD';
    } catch {
      // May not be on a branch
    }

    return NextResponse.json({
      success: true,
      action: 'branches',
      branches: branches.map((name) => ({
        name,
        current: name === currentBranch,
      })),
      currentBranch,
      total: branches.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git branch list failed: ${message}` },
      { status: 500 }
    );
  }
}

async function handleListRemotes(dir: string) {
  try {
    const remotes = await git.listRemotes({ fs, dir });

    return NextResponse.json({
      success: true,
      action: 'remotes',
      remotes: remotes.map((r) => ({
        remote: r.remote,
        url: r.url,
      })),
      total: remotes.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Git remote list failed: ${message}` },
      { status: 500 }
    );
  }
}

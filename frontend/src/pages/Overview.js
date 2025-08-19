// Overview.js
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import api from "../utils/axiosConfig";

/* --- IntersectionObserver hook for reveal animations --- */
function useReveal(options = { root: null, rootMargin: "0px", threshold: 0.15 }) {
  const refs = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.reveal = "true";
        }
      });
    }, options);

    refs.current.forEach((r) => r && observer.observe(r));
    return () => {
      refs.current.forEach((r) => r && observer.unobserve(r));
      observer.disconnect();
    };
  }, [options]);

  const setRef = (el, idx) => {
    refs.current[idx] = el;
  };

  return { setRef };
}

export default function Overview() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("Welcome");
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user + data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [profileRes, projectsRes, deploymentsRes] = await Promise.allSettled([
          api.get("/api/auth/profile"),
          api.get("/api/projects"),
          api.get("/api/deployments"),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value.data?.data?.user) {
          const { user } = profileRes.value.data.data;
          const { name, email } = user;

          if (name && name !== 'User') {
            setDisplayName(`Welcome, ${name}`);
          } else if (email) {
            setDisplayName(`Welcome, ${email.split("@")[0]}`);
          } else {
            setDisplayName("Welcome");
          }
        }

        if (projectsRes.status === "fulfilled" && projectsRes.value.data?.success) {
          setProjects(projectsRes.value.data.data || []);
        }
        if (deploymentsRes.status === "fulfilled" && deploymentsRes.value.data?.success) {
          setDeployments(deploymentsRes.value.data.data || []);
        }
      } catch (err) {
        console.error("Error loading overview", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { setRef } = useReveal();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-black">
        <div className="animate-spin border-2 border-black dark:border-white border-t-transparent h-8 w-8" />
      </div>
    );
  }

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(0,0,0,0.16) 0 1px, transparent 1px 32px)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px),
            repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px)
          `,
        }}
      />

      {/* Reveal animation styles */}
      <style>{`
        [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms ease; }
        [data-reveal="true"] { opacity: 1; transform: translateY(0); }
      `}</style>

      <main className="relative z-10">
        {/* Greeting */}
        <section ref={(el) => setRef(el, 0)} data-reveal className="py-16 flex items-center px-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-extrabold">{displayName}</h1>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              This is your deployment hub. Scroll to discover features, workflows, and architecture —
              designed with engineers in mind.
            </p>
          </div>
        </section>

        {/* Static info (lightweight intro from README/DOCS) */}
        <section className="px-10 -mt-4">
          <div
            ref={(el) => setRef(el, 100)}
            data-reveal
            className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] max-w-4xl"
          >
            <p className="text-gray-700 dark:text-gray-300">
              Shard is a deployment platform with AI code review for MERN, Django, and Flask.
            </p>
            <ul className="mt-3 list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
              <li>One‑click deployments from GitHub with real‑time progress.</li>
              <li>Secure environment management with encryption and runtime injection.</li>
              <li>AI‑powered code review with static analysis and detailed insights.</li>
              <li>Live site links, status tracking, and health checks out‑of‑the‑box.</li>
            </ul>
          </div>
        </section>

        {/* Quick stats */}
        <section className="px-10 py-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Projects", value: projects.length },
            { label: "Deployments", value: deployments.length },
            { label: "Frameworks", value: "Flask / MERN / Django" },
          ].map((stat, i) => (
            <div
              key={i}
              ref={(el) => setRef(el, i + 1)}
              data-reveal
              className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]"
            >
              <div className="text-sm opacity-75">{stat.label}</div>
              <div className=" text-xl font-bold">{stat.value}</div>
            </div>
          ))}
        </section>

        {/* Features (text-based, fewer cards) */}
        <section className="px-10 py-16">
          <div ref={(el) => setRef(el, 10)} data-reveal>
            <h3 className=" text-xl font-bold mb-4">Core capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300">
              <ul className="space-y-2 list-disc pl-5">
                <li>Deploy from GitHub with framework detection, build caching, and reliable rollbacks.</li>
                <li>AI code review + static analysis (ESLint, Pylint, Bandit) to surface issues early.</li>
                <li>Encrypted environment variables with project‑scoped configs and audit trails.</li>
              </ul>
              <ul className="space-y-2 list-disc pl-5">
                <li>Real‑time logs, status tracking, notifications, and health checks.</li>
                <li>Security best practices: JWT auth, OAuth (GitHub/Google), rate limiting, CORS, headers.</li>
                <li>Supported stacks: MERN, Django, Flask with framework‑specific Dockerfiles.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works (timeline) */}
        <section className="px-10 py-8">
          <div ref={(el) => setRef(el, 30)} data-reveal className="max-w-4xl">
            <h3 className=" text-xl font-bold mb-4">How it works</h3>
            <div className="relative pl-8 border-l-2 border-black dark:border-white space-y-8">
              {[
                { t: "Connect GitHub", d: "Authorize access and select a repository." },
                { t: "Import & configure env", d: "Create a project and add encrypted environment variables." },
                { t: "Trigger deployment", d: "Start a build with one click from the dashboard." },
                { t: "AI review & build", d: "Static analysis + AI code review inform the deployment decision." },
                { t: "Live logs & health", d: "Follow logs in real time; access the running app with health checks." },
              ].map((s, idx) => (
                <div key={idx} className="relative">
                  <h4 className="font-semibold">{idx + 1}. {s.t}</h4>
                  <p className="text-gray-700 dark:text-gray-300">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture summary (no card) */}
        <section className="px-10 py-12">
          <div ref={(el) => setRef(el, 50)} data-reveal>
            <h3 className=" text-xl font-bold mb-2">Architecture at a glance</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">Microservices built for reliability and speed:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
              <div><span className="font-semibold">Frontend:</span> React dashboard with real‑time monitoring.</div>
              <div><span className="font-semibold">Backend API:</span> Node/Express + MongoDB with JWT & OAuth.</div>
              <div><span className="font-semibold">Deployment Worker:</span> Docker orchestration, env injection, log streaming.</div>
              <div><span className="font-semibold">AI Review:</span> Django service for static analysis and AI insights.</div>
            </div>
          </div>
        </section>

        {/* Recent projects */}
        <section className="px-10 py-16 border-t border-gray-200 dark:border-gray-800">
          <h3 className=" text-xl font-bold mb-6">Recent Projects</h3>
          {recentProjects.length === 0 ? (
            <div className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)]">
              <p className="mb-4">No projects yet.</p>
              <button
                onClick={() => navigate("/app/projects/new")}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white hover:scale-105 transition-transform"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map((p, idx) => (
                <div
                  key={p._id}
                  ref={(el) => setRef(el, 20 + idx)}
                  data-reveal
                  onClick={() => navigate(`/app/projects/${p._id}`)}
                  className="cursor-pointer p-6 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white shadow-[-6px_6px_0_rgba(0,0,0,0.8)] dark:shadow-[-6px_6px_0_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-transform"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold truncate">{p.name}</h4>
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-2">
                    {p.subdomain ? `${p.subdomain}.localhost` : p.repoUrl}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 border-2 border-black dark:border-white bg-white dark:bg-black">
                      {p.framework?.toUpperCase() || "UNKNOWN"}
                    </span>
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Final CTA */}
        <section className="py-20 px-8">
          <div className="max-w-4xl mx-auto text-center border-2 border-black dark:border-white bg-gray-50 dark:bg-gray-900 text-black dark:text-white p-12 shadow-[-10px_10px_0_rgba(0,0,0,0.9)] dark:shadow-[-10px_10px_0_rgba(255,255,255,0.6)]">
            <h3 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to ship?</h3>
            <p className="mb-6 text-lg opacity-85">Create a project and deploy in minutes.</p>
            <button
              onClick={() => navigate("/app/projects/new")}
              className="px-6 py-3 bg-white text-black dark:bg-black dark:text-white border-2 border-current font-semibold hover:scale-105 transition-transform"
            >
              Create New Project →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

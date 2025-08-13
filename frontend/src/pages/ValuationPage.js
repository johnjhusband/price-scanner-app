import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/ValuationPage.css';

const ValuationPage = () => {
  const { slug } = useParams();
  const [valuation, setValuation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchValuation();
  }, [slug]);

  const fetchValuation = async () => {
    try {
      const response = await fetch(`/api/valuations/${slug}`);
      const data = await response.json();
      setValuation(data);
    } catch (error) {
      console.error('Error fetching valuation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="valuation-loading">Loading valuation...</div>;
  }

  if (!valuation) {
    return <div className="valuation-error">Valuation not found</div>;
  }

  const pageUrl = `${window.location.origin}/value/${slug}`;

  return (
    <div className="valuation-page">
      <article itemScope itemType="https://schema.org/Product">
        <div className="valuation-header">
          <h1 itemProp="name">{valuation.title}</h1>
          <div className="valuation-meta">
            <span>Found by u/{valuation.source_author}</span>
            <span> • </span>
            <time dateTime={valuation.source_date}>
              {new Date(valuation.source_date).toLocaleDateString()}
            </time>
          </div>
        </div>

        <div className="valuation-content">
          <div className="valuation-image">
            <img 
              src={valuation.image_url} 
              alt={valuation.title}
              itemProp="image"
            />
          </div>

          <div className="valuation-details">
            <div className="valuation-value" itemProp="offers" itemScope itemType="https://schema.org/AggregateOffer">
              <h2>Estimated Value</h2>
              <div className="value-range">
                <span itemProp="lowPrice">${valuation.min_value}</span>
                <span> - </span>
                <span itemProp="highPrice">${valuation.max_value}</span>
              </div>
              <meta itemProp="priceCurrency" content="USD" />
            </div>

            {valuation.brand && (
              <div className="valuation-brand">
                <strong>Brand:</strong> <span itemProp="brand">{valuation.brand}</span>
              </div>
            )}

            {valuation.confidence && (
              <div className="valuation-confidence">
                <strong>Confidence:</strong> {(valuation.confidence * 100).toFixed(0)}%
              </div>
            )}

            <div className="valuation-description" itemProp="description">
              {valuation.description}
            </div>

            <div className="valuation-cta">
              <h3>Want to value your own finds?</h3>
              <a href="/scan" className="cta-button">
                Scan with Flippi
              </a>
              <p>Get instant valuations for your thrift store treasures!</p>
            </div>

            <div className="valuation-share">
              <h3>Share this find</h3>
              <div className="qr-code">
                <QRCodeSVG value={pageUrl} size={150} />
              </div>
              <input 
                type="text" 
                value={pageUrl} 
                readOnly 
                className="share-url"
                onClick={(e) => e.target.select()}
              />
            </div>
          </div>
        </div>

        <footer className="valuation-footer">
          <p>
            Original post on{' '}
            <a href={valuation.source_url} rel="nofollow ugc">
              Reddit
            </a>
          </p>
          <p className="disclaimer">
            Valuations are estimates based on AI analysis and market data.
            Actual value may vary based on condition, authenticity, and market demand.
          </p>
        </footer>
      </article>
    </div>
  );
};

export default ValuationPage;